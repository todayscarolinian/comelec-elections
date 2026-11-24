import Image from 'next/image'

export function ElectionFooterBrand() {
  return (
    <span className="block min-w-0">
      <span className="flex items-start gap-2 font-sans min-[38rem]:gap-3">
        <span className="inline-flex min-w-0 items-center gap-2">
          <Image
            src="/branding/comelec-seal.png"
            alt=""
            width={40}
            height={40}
            draggable={false}
            className="size-6 shrink-0 object-contain select-none min-[38rem]:size-10"
          />
          <span className="grid min-w-0 gap-0.5">
            <span className="font-editorial text-base/5 min-[38rem]:text-lg/6">SSC COMELEC</span>
            <small className="text-xs/4 text-comelec-olive">
              Supreme Student Council Elections · 2026
            </small>
          </span>
        </span>
        <span aria-hidden="true" className="shrink-0 self-center text-sm text-comelec-olive">
          ×
        </span>
        <span className="inline-flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="w-6 shrink-0 text-center font-(family-name:--font-roboto-condensed) text-[0.9375rem]/6 font-bold tracking-tight text-[#000000] select-none min-[38rem]:w-10 min-[38rem]:text-[2.375rem]/10"
          >
            TC
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className="text-base/5 font-bold tracking-tight min-[38rem]:text-lg/6">
              Today’s Carolinian
            </span>
            <small className="text-xs/4 text-comelec-olive">Your paper, our commitment</small>
          </span>
        </span>
      </span>
    </span>
  )
}
