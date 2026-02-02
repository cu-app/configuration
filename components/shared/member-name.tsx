"use client"

export interface MemberNameProps {
  firstName?: string
  middleName?: string
  lastName?: string
  suffix?: string
  className?: string
}

export function MemberName({
  firstName = "",
  middleName = "",
  lastName = "",
  suffix = "",
  className,
}: MemberNameProps) {
  const parts = [firstName, middleName, lastName].filter(Boolean)
  const name = parts.join(" ") + (suffix ? ` ${suffix}` : "")
  if (!name.trim()) return null
  return <span className={className}>{name}</span>
}
