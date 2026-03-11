import { notFound } from "next/navigation"
import { getPublicClinic } from "@/lib/api/public-clinics"
import { ClinicProfile } from "./clinic-profile"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  try {
    const { slug } = await params
    const clinic = await getPublicClinic(slug)
    return {
      title: `${clinic.name} | Clínica`,
      description:
        clinic.description ?? `Conheça ${clinic.name}. Agende consultas online.`,
      openGraph: {
        title: clinic.name,
        description: clinic.description ?? undefined,
        images: clinic.logoUrl ? [clinic.logoUrl] : undefined,
      },
    }
  } catch {
    return { title: "Clínica não encontrada" }
  }
}

export default async function ClinicPage({ params }: Props) {
  const { slug } = await params
  let clinic
  try {
    clinic = await getPublicClinic(slug)
  } catch {
    notFound()
  }

  return <ClinicProfile clinic={clinic} />
}
