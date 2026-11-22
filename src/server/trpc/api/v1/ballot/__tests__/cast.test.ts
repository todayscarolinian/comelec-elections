// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('@/server/ocr', () => ({ readStudentProfile: vi.fn() }))
vi.mock('@/server/storage', () => ({ getSupabaseAdmin: vi.fn() }))

import { now, personId, prismaError, setup, validBallot } from './castHelpers'

afterEach(() => vi.useRealTimers())

describe('ballot.cast', () => {
  it('rejects signed-out callers before starting a transaction', async () => {
    const { caller, db } = setup({ currentSession: null })
    await expect(caller.ballot.cast(validBallot())).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('rejects a session whose Person no longer exists', async () => {
    const { caller, db } = setup({ personExists: false })
    await expect(caller.ballot.cast(validBallot())).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it.each(['CLOSED', null] as const)(
    'rejects election state %s before reading Registration',
    async (electionStatus) => {
      const { caller, tx } = setup({ electionStatus })
      await expect(caller.ballot.cast(validBallot())).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'ElectionClosed',
      })
      expect(tx.$queryRaw).toHaveBeenCalledTimes(1)
      expect(tx.ballot.create).not.toHaveBeenCalled()
    },
  )

  it('rejects callers with no Registration', async () => {
    const { caller, tx } = setup({ registration: null })
    await expect(caller.ballot.cast(validBallot())).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'NotRegistered',
    })
    expect(tx.ballot.create).not.toHaveBeenCalled()
  })

  it.each(['PENDING', 'REJECTED'] as const)(
    'rejects %s Registration without held acknowledgement',
    async (status) => {
      const { caller, tx } = setup({ registration: { status, yearLevel: '2' } })
      await expect(caller.ballot.cast(validBallot())).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'HeldNotAcknowledged',
      })
      expect(tx.ballot.create).not.toHaveBeenCalled()
    },
  )

  it.each([false, null, 'true', 1] as const)(
    'rejects %j as an invalid Ballot rather than a Held Ballot acknowledgement',
    async (heldAcknowledged) => {
      const { caller, tx } = setup({ registration: { status: 'PENDING', yearLevel: '2' } })
      await expect(
        // @ts-expect-error malformed submissions intentionally bypass client typing
        caller.ballot.cast({ ...validBallot(), heldAcknowledged }),
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'InvalidBallot',
      })
      expect(tx.ballot.create).not.toHaveBeenCalled()
    },
  )

  it.each(['PENDING', 'REJECTED'] as const)(
    'allows %s Registration with held acknowledgement',
    async (status) => {
      const { caller, tx } = setup({ registration: { status, yearLevel: '2' } })
      await expect(
        caller.ballot.cast({ ...validBallot(), heldAcknowledged: true }),
      ).resolves.toEqual({ ok: true, held: true })
      expect(tx.ballot.create).toHaveBeenCalledWith({
        data: {
          personId,
          yearLevel: '2',
          disclosureAcceptedAt: expect.any(Date),
          heldAcknowledgedAt: expect.any(Date),
          castAt: expect.any(Date),
        },
        select: { id: true },
      })
    },
  )

  it('locks main ElectionState FOR SHARE and uses only transaction-scoped reads and writes', async () => {
    const { caller, tx, events, db } = setup()
    await expect(caller.ballot.cast(validBallot())).resolves.toEqual({ ok: true, held: false })
    expect(db.$transaction).toHaveBeenCalledTimes(1)
    const [strings, ...values] = tx.$queryRaw.mock.calls[0] as unknown as [
      TemplateStringsArray,
      ...unknown[],
    ]
    expect(strings.join('?')).toMatch(/SELECT\s+"electionStatus"\s+FROM\s+"ElectionState"/i)
    expect(strings.join('?')).toMatch(/WHERE\s+id\s*=\s*'main'\s+FOR SHARE/i)
    expect(values).toEqual([])
    const [regStrings, ...regValues] = tx.$queryRaw.mock.calls[1] as unknown as [
      TemplateStringsArray,
      ...unknown[],
    ]
    expect(regStrings.join('?')).toMatch(
      /SELECT\s+status,\s+"yearLevel",\s+school\s+FROM\s+"Registration"\s+WHERE\s+"personId"\s*=\s*\?\s+FOR SHARE/i,
    )
    expect(regValues).toEqual([personId])
    expect(events).toEqual([
      'begin',
      'lock',
      'registration',
      'ballot',
      'answers',
      'notification',
      'commit',
    ])
    // Only whether the Ballot is held: never choices or the Ballot id.
    expect(tx.notification.create).toHaveBeenCalledExactlyOnceWith({
      data: { personId, type: 'BALLOT_RECORDED', data: { held: false } },
      select: { id: true },
    })
  })

  it('stores authenticated Person, Registration year and School snapshots and server timestamp', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const { caller, tx } = setup({
      registration: { status: 'APPROVED', yearLevel: '4', school: 'SBE' },
    })
    await caller.ballot.cast(validBallot())
    expect(tx.ballot.create).toHaveBeenCalledWith({
      data: {
        personId: 'person-1',
        yearLevel: '4',
        school: 'SBE',
        disclosureAcceptedAt: now,
        heldAcknowledgedAt: null,
        castAt: now,
      },
      select: { id: true },
    })
  })

  it('stores a server-generated held timestamp and rejects a client timestamp', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const { caller, tx } = setup({ registration: { status: 'PENDING', yearLevel: '2' } })
    await expect(
      caller.ballot.cast({
        ...validBallot(),
        heldAcknowledged: true,
        // @ts-expect-error client timestamps are intentionally untyped and rejected
        heldAcknowledgedAt: '2000-01-01T00:00:00.000Z',
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'InvalidBallot' })
    expect(tx.ballot.create).not.toHaveBeenCalled()

    await expect(caller.ballot.cast({ ...validBallot(), heldAcknowledged: true })).resolves.toEqual(
      { ok: true, held: true },
    )
    expect(tx.ballot.create).toHaveBeenCalledWith({
      data: {
        personId,
        yearLevel: '2',
        disclosureAcceptedAt: now,
        heldAcknowledgedAt: now,
        castAt: now,
      },
      select: { id: true },
    })
  })

  it('stores null for Abstention and one answer per selected Candidate', async () => {
    const { caller, tx } = setup()
    await caller.ballot.cast(validBallot())
    expect(tx.ballotAnswer.createMany).toHaveBeenCalledWith({
      data: [
        { ballotId: 'ballot-1', questionId: 'placeholder-question-1', candidateId: null },
        {
          ballotId: 'ballot-1',
          questionId: 'placeholder-question-2',
          candidateId: 'placeholder-question-2-candidate-d',
        },
        {
          ballotId: 'ballot-1',
          questionId: 'placeholder-question-2',
          candidateId: 'placeholder-question-2-candidate-c',
        },
      ],
    })
  })

  it('accepts an all-Abstention Ballot', async () => {
    const { caller, tx } = setup()
    const input = validBallot()
    input.answers['placeholder-question-2'] = { abstain: true }
    await expect(caller.ballot.cast(input)).resolves.toEqual({ ok: true, held: false })
    expect(tx.ballotAnswer.createMany).toHaveBeenCalledWith({
      data: [
        { ballotId: 'ballot-1', questionId: 'placeholder-question-1', candidateId: null },
        { ballotId: 'ballot-1', questionId: 'placeholder-question-2', candidateId: null },
      ],
    })
  })

  it.each([
    undefined,
    null,
    [],
    {},
    { ...validBallot(), disclosureAccepted: false },
    { ...validBallot(), answers: {} },
    { ...validBallot(), personId: 'another-person' },
    {
      ...validBallot(),
      answers: { ...validBallot().answers, 'private-unknown-question': { abstain: true } },
    },
    {
      ...validBallot(),
      answers: {
        ...validBallot().answers,
        'placeholder-question-1': { candidateIds: ['private-unknown-candidate'] },
      },
    },
    {
      ...validBallot(),
      answers: {
        ...validBallot().answers,
        'placeholder-question-2': {
          candidateIds: [
            'placeholder-question-2-candidate-c',
            'placeholder-question-2-candidate-c',
          ],
        },
      },
    },
  ])('rejects invalid input %# inside transaction without inserting', async (input) => {
    const { caller, tx, events } = setup()
    // @ts-expect-error malformed submissions intentionally bypass client typing
    await expect(caller.ballot.cast(input)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'InvalidBallot',
      cause: undefined,
    })
    expect(events).toEqual(['begin', 'lock', 'registration', 'rollback'])
    expect(tx.ballot.create).not.toHaveBeenCalled()
    expect(tx.ballotAnswer.createMany).not.toHaveBeenCalled()
  })

  it('reports a malformed Held Ballot as InvalidBallot, not HeldNotAcknowledged', async () => {
    const { caller, tx } = setup({ registration: { status: 'PENDING', yearLevel: '2' } })
    // @ts-expect-error invalid on purpose to check ordering
    await expect(caller.ballot.cast({})).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'InvalidBallot',
    })
    expect(tx.ballot.create).not.toHaveBeenCalled()
  })

  it('checks election state before validating choices', async () => {
    const { caller } = setup({ electionStatus: 'CLOSED' })
    // @ts-expect-error invalid on purpose to check ordering
    await expect(caller.ballot.cast({})).rejects.toMatchObject({ message: 'ElectionClosed' })
  })

  it.each([
    { target: ['personId'] },
    { target: 'Ballot_personId_key' },
    {
      modelName: 'Ballot',
      driverAdapterError: {
        cause: { kind: 'UniqueConstraintViolation', constraint: { index: 'Ballot_personId_key' } },
      },
    },
    {
      modelName: 'Ballot',
      driverAdapterError: {
        cause: { kind: 'UniqueConstraintViolation', constraint: { fields: ['personId'] } },
      },
    },
  ])('maps Ballot.personId unique violation %# to AlreadyVoted after rollback', async (meta) => {
    const { caller, tx, events } = setup()
    tx.ballot.create.mockRejectedValueOnce(prismaError('P2002', meta))
    await expect(caller.ballot.cast(validBallot())).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'AlreadyVoted',
      cause: undefined,
    })
    expect(events.at(-1)).toBe('rollback')
    expect(tx.ballotAnswer.createMany).not.toHaveBeenCalled()
  })

  it('does not replace or recast an existing Held Ballot', async () => {
    const { caller, tx, events } = setup({
      registration: { status: 'PENDING', yearLevel: '2' },
    })
    tx.ballot.create.mockRejectedValueOnce(prismaError('P2002', { target: 'Ballot_personId_key' }))
    await expect(
      caller.ballot.cast({ ...validBallot(), heldAcknowledged: true }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'AlreadyVoted',
      cause: undefined,
    })
    expect(events.at(-1)).toBe('rollback')
    expect(tx.ballotAnswer.createMany).not.toHaveBeenCalled()
  })

  it('maps a second Held Ballot insert (mocked P2002) to AlreadyVoted', async () => {
    const { caller, tx } = setup({
      registration: { status: 'PENDING', yearLevel: '2' },
    })
    let creates = 0
    tx.ballot.create.mockImplementation(async () => {
      creates += 1
      if (creates > 1) throw prismaError('P2002', { target: ['personId'] })
      return { id: 'ballot-1' }
    })
    const input = { ...validBallot(), heldAcknowledged: true as const }

    const attempts = await Promise.allSettled([
      caller.ballot.cast(input),
      caller.ballot.cast(input),
    ])

    expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1)
    expect(attempts.filter((attempt) => attempt.status === 'rejected')).toHaveLength(1)
    expect(tx.ballotAnswer.createMany).toHaveBeenCalledTimes(1)
  })

  it.each([
    prismaError('P2002', { target: ['id'] }),
    prismaError('P2002'),
    prismaError('P2002', {
      driverAdapterError: { cause: { constraint: { index: 'Ballot_pkey' } } },
    }),
    prismaError('P2003'),
    new Error('Private database failure'),
  ])(
    'sanitizes unrelated Ballot insert failure %# rather than returning AlreadyVoted',
    async (error) => {
      const { caller, tx } = setup()
      tx.ballot.create.mockRejectedValueOnce(error)
      await expect(caller.ballot.cast(validBallot())).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to cast Ballot.',
        cause: undefined,
      })
    },
  )

  it('propagates Answer failure out of transaction and never reports success', async () => {
    const { caller, tx, events } = setup()
    tx.ballotAnswer.createMany.mockRejectedValueOnce(
      prismaError('P2002', { target: ['ballotId', 'questionId', 'candidateId'] }),
    )
    await expect(caller.ballot.cast(validBallot())).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      cause: undefined,
    })
    expect(events).toEqual(['begin', 'lock', 'registration', 'ballot', 'rollback'])
  })

  it('does not report success while the transaction is waiting to commit', async () => {
    const { caller, db, tx } = setup()
    const ready = Promise.withResolvers<void>()
    const commit = Promise.withResolvers<void>()
    db.$transaction.mockImplementationOnce(async (fn) => {
      const value = await fn(tx)
      ready.resolve()
      await commit.promise
      return value
    })
    let resolved = false
    const result = caller.ballot.cast(validBallot()).then((value) => {
      resolved = true
      return value
    })
    await ready.promise
    expect(resolved).toBe(false)
    commit.resolve()
    await expect(result).resolves.toEqual({ ok: true, held: false })
  })

  it('sanitizes commit failures instead of reporting success', async () => {
    const { caller, db } = setup()
    db.$transaction.mockRejectedValueOnce(new Error('Private commit failure'))
    await expect(caller.ballot.cast(validBallot())).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      cause: undefined,
    })
  })
})
