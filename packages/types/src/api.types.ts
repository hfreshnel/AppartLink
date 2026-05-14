export type ApiSuccess<T> = {
    data: T
    error?: never
}

export type ApiError = {
    data?: never
    error: string
    code?: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export type PaginatedResponse<T> = {
    data: T[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
}

export type AssetStatus = 'DRAFT' | 'TOUR_PENDING' | 'PUBLISHED' | 'RENTED' | 'ARCHIVED'
export type AssetType = 'PROPERTY' | 'VEHICLE'
export type TourOrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'SCHEDULED' | 'SHOT' | 'PUBLISHED'
export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN'
export type DocumentType =
    | 'ID_CARD'
    | 'PROOF_OF_INCOME'
    | 'EMPLOYMENT_CONTRACT'
    | 'BANK_STATEMENT'
    | 'TAX_NOTICE'
    | 'OTHER'
export type DocumentStatus = 'PENDING' | 'SCANNING' | 'VALIDATED' | 'REJECTED'
export type LeaseStatus = 'DRAFT' | 'SIGNED' | 'ARCHIVED'
export type PaymentType = 'TOUR_FEE' | 'COMMISSION' | 'ESCROW'
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'
