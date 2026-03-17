"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import {
  publicCheckoutApi,
  type PublicCheckoutLinkInput,
  type PublicPaymentCheckInput,
} from "@/lib/api/public-checkout"

const PUBLIC_CHECKOUT_KEY = ["public", "ailum", "checkout"] as const

export function usePublicAilumPlans() {
  return useQuery({
    queryKey: [...PUBLIC_CHECKOUT_KEY, "plans"],
    queryFn: publicCheckoutApi.plans,
  })
}

export function useCreatePublicAilumCheckoutLink() {
  return useMutation({
    mutationFn: (body: PublicCheckoutLinkInput) =>
      publicCheckoutApi.createCheckoutLink(body),
  })
}

export function useCheckPublicAilumPayment() {
  return useMutation({
    mutationFn: (body: PublicPaymentCheckInput) =>
      publicCheckoutApi.paymentCheck(body),
  })
}
