import Image from 'next/image'

export function ElectionFooterBrand() {
  return (
    <span className="block min-w-0">
      <span className="flex items-start font-sans">
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
      </span>
    </span>
  )
}
