// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
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
      expect(tx.registration.findUnique).not.toHaveBeenCalled()
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
    'rejects %s Registration until S3-04',
    async (status) => {
      const { caller, tx } = setup({ registration: { status, yearLevel: '2' } })
      await expect(caller.ballot.cast(validBallot())).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'RegistrationNotApproved',
      })
      expect(tx.ballot.create).not.toHaveBeenCalled()
    },
  )

  it('locks main ElectionState FOR SHARE and uses only transaction-scoped reads and writes', async () => {
    const { caller, tx, events, db } = setup()
    await expect(caller.ballot.cast(validBallot())).resolves.toEqual({ ok: true })
    expect(db.$transaction).toHaveBeenCalledTimes(1)
    const [strings, ...values] = tx.$queryRaw.mock.calls[0] as unknown as [
      TemplateStringsArray,
      ...unknown[],
    ]
    expect(strings.join('?')).toMatch(/SELECT\s+"electionStatus"\s+FROM\s+"ElectionState"/i)
    expect(strings.join('?')).toMatch(/WHERE\s+id\s*=\s*'main'\s+FOR SHARE/i)
    expect(values).toEqual([])
    expect(tx.registration.findUnique).toHaveBeenCalledWith({
      where: { personId },
      select: { status: true, yearLevel: true },
    })
    expect(events).toEqual(['begin', 'lock', 'registration', 'ballot', 'answers', 'commit'])
  })

  it('stores authenticated Person, Registration year snapshot and server timestamp', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const { caller, tx } = setup({ registration: { status: 'APPROVED', yearLevel: '4' } })
    await caller.ballot.cast(validBallot())
    expect(tx.ballot.create).toHaveBeenCalledWith({
      data: { personId: 'person-1', yearLevel: '4', disclosureAcceptedAt: now },
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
    await expect(caller.ballot.cast(input)).resolves.toEqual({ ok: true })
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
      await fn(tx)
      ready.resolve()
      await commit.promise
    })
    let resolved = false
    const result = caller.ballot.cast(validBallot()).then((value) => {
      resolved = true
      return value
    })
    await ready.promise
    expect(resolved).toBe(false)
    commit.resolve()
    await expect(result).resolves.toEqual({ ok: true })
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
