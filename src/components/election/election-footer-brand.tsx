import Image from 'next/image'

export function ElectionFooterBrand({ sealSize = 48 }: { sealSize?: number }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Image
        src="/branding/comelec-seal.png"
        alt=""
        width={sealSize}
        height={sealSize}
        className="shrink-0 object-contain"
      />
      <span>
        <span className="block font-editorial text-4xl leading-tight">SSC COMELEC</span>
        <small className="block font-sans text-xs leading-snug text-comelec-olive">
          Supreme Student Council Elections · 2026
        </small>
      </span>
    </span>
  )
}
