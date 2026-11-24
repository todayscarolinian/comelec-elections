import Image from 'next/image'

export function ElectionFooterBrand() {
  return (
    <span className="block min-w-0">
      <span className="grid grid-cols-2 gap-4 font-sans min-[38rem]:flex min-[38rem]:items-start min-[38rem]:gap-3">
        <span className="flex min-w-0 flex-col items-start gap-2 min-[38rem]:flex-row min-[38rem]:items-center">
          <Image
            src="/branding/comelec-seal.png"
            alt=""
            width={40}
            height={40}
            draggable={false}
            className="size-8 shrink-0 object-contain select-none min-[38rem]:size-10"
          />
          <span className="grid min-w-0 gap-0.5">
            <span className="font-editorial text-sm/5 min-[38rem]:text-lg/6">SSC COMELEC</span>
            <small className="text-xs/4 text-comelec-olive max-[38rem]:text-[0.6875rem]/4">
              Supreme Student Council Elections&nbsp;·&nbsp;2026
            </small>
          </span>
        </span>
        <span
          aria-hidden="true"
          className="hidden shrink-0 self-center text-sm text-comelec-olive min-[38rem]:inline"
        >
          ×
        </span>
        <span className="flex min-w-0 flex-col items-start gap-2 min-[38rem]:flex-row min-[38rem]:items-center">
          <span
            aria-hidden="true"
            className="w-8 shrink-0 text-center font-(family-name:--font-roboto-condensed) text-2xl/8 font-bold tracking-tight text-[#000000] select-none min-[38rem]:w-10 min-[38rem]:text-[2.375rem]/10"
          >
            TC
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className="text-sm/5 font-bold tracking-tight min-[38rem]:text-lg/6">
              Today’s Carolinian
            </span>
            <small className="text-xs/4 text-comelec-olive max-[38rem]:mt-1 max-[38rem]:text-[0.6875rem]/4">
              Your commitment, our paper
            </small>
          </span>
        </span>
      </span>
    </span>
  )
}
