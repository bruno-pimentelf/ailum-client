import type { ReactNode } from "react"
import {
  ImageIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  FileTextIcon,
  StickerIcon,
  WaveformIcon,
  MapPinIcon,
  AddressBookIcon,
  CurrencyCircleDollarIcon,
} from "@phosphor-icons/react"

const SIZE = 12

function PreviewLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1">
      {icon}
      {label}
    </span>
  )
}

export function formatMessagePreview(content?: string | null): ReactNode {
  const raw = (content ?? "").trim()
  if (!raw) return ""

  const normalized = raw.toLowerCase()

  if (["[imagem]", "imagem", "[image]", "image"].includes(normalized))
    return <PreviewLabel icon={<ImageIcon size={SIZE} />} label="Imagem" />
  if (["[áudio]", "áudio", "[audio]", "audio"].includes(normalized))
    return <PreviewLabel icon={<MicrophoneIcon size={SIZE} />} label="Áudio" />
  if (["[mensagem de voz]", "mensagem de voz", "[voice message]", "voice message"].includes(normalized))
    return <PreviewLabel icon={<WaveformIcon size={SIZE} />} label="Mensagem de voz" />
  if (["[vídeo]", "vídeo", "[video]", "video"].includes(normalized))
    return <PreviewLabel icon={<VideoCameraIcon size={SIZE} />} label="Vídeo" />
  if (["[documento]", "documento", "[document]", "document", "[arquivo]", "arquivo", "[file]", "file"].includes(normalized))
    return <PreviewLabel icon={<FileTextIcon size={SIZE} />} label="Documento" />
  if (["[figurinha]", "figurinha", "[sticker]", "sticker"].includes(normalized))
    return <PreviewLabel icon={<StickerIcon size={SIZE} />} label="Figurinha" />
  if (["[localização]", "localização", "[location]", "location"].includes(normalized))
    return <PreviewLabel icon={<MapPinIcon size={SIZE} />} label="Localização" />
  if (["[contato]", "contato", "[contact]", "contact"].includes(normalized))
    return <PreviewLabel icon={<AddressBookIcon size={SIZE} />} label="Contato" />
  if (["[cobrança pix]", "cobrança pix", "[pix]", "pix"].includes(normalized))
    return <PreviewLabel icon={<CurrencyCircleDollarIcon size={SIZE} />} label="Cobrança PIX" />

  return raw
}
