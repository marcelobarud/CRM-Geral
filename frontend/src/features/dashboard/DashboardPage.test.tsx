// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../services/httpClient'
import * as customerApi from '../customers/api'
import * as employeeApi from '../employees/api'
import * as productApi from '../products/api'
import * as salesApi from '../sales/api'
import * as supplierApi from '../suppliers/api'
import type { Customer } from '../customers/types'
import type { Employee } from '../employees/types'
import type { Product } from '../products/types'
import type { Sale } from '../sales/types'
import type { Supplier } from '../suppliers/types'
import { DashboardPage } from './DashboardPage'

vi.mock('../customers/api', () => ({ listCustomers: vi.fn() }))
vi.mock('../employees/api', () => ({ listEmployees: vi.fn() }))
vi.mock('../products/api', () => ({ listProducts: vi.fn() }))
vi.mock('../sales/api', () => ({ listSales: vi.fn() }))
vi.mock('../suppliers/api', () => ({ listSuppliers: vi.fn() }))

const customer = {} as Customer
const employee = {} as Employee
const product = {} as Product
const supplier = {} as Supplier
const sale = {} as Sale

describe('DashboardPage', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(customerApi.listCustomers).mockResolvedValue([])
    vi.mocked(employeeApi.listEmployees).mockResolvedValue([])
    vi.mocked(productApi.listProducts).mockResolvedValue([])
    vi.mocked(salesApi.listSales).mockResolvedValue([])
    vi.mocked(supplierApi.listSuppliers).mockResolvedValue([])
  })

  it('loads and renders operational counts and all shortcuts', async () => {
    vi.mocked(customerApi.listCustomers).mockResolvedValue([customer, customer])
    vi.mocked(employeeApi.listEmployees).mockResolvedValue([employee, employee, employee, employee])
    vi.mocked(productApi.listProducts).mockResolvedValue([product, product, product])
    vi.mocked(salesApi.listSales).mockResolvedValue([sale, sale, sale, sale, sale])
    vi.mocked(supplierApi.listSuppliers).mockResolvedValue([supplier])
    const onNavigate = vi.fn()

    render(<DashboardPage onNavigate={onNavigate} />)

    expect(await screen.findByText('Resumo operacional')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Clientes/ }).textContent).toContain('2')
    expect(screen.getByRole('link', { name: /Produtos/ }).textContent).toContain('3')
    expect(screen.getByRole('link', { name: /Fornecedores/ }).textContent).toContain('1')
    expect(screen.getByRole('link', { name: /Funcionários/ }).textContent).toContain('4')
    expect(screen.getByRole('link', { name: /Vendas/ }).textContent).toContain('5')
    expect(screen.getByRole('link', { name: /Nova vendaRegistre uma venda com um ou mais produtos/ })).toBeTruthy()

    const sections = Array.from(document.querySelectorAll('.dashboard-section'))
    expect(sections[0]?.classList.contains('dashboard-actions-section')).toBe(true)
    expect(sections[1]?.querySelector('#dashboard-summary-title')).toBeTruthy()
  })

  it('shows a consistent loading state while list requests are pending', () => {
    vi.mocked(customerApi.listCustomers).mockImplementation(() => new Promise<never>(() => {}))
    vi.mocked(employeeApi.listEmployees).mockImplementation(() => new Promise<never>(() => {}))
    vi.mocked(productApi.listProducts).mockImplementation(() => new Promise<never>(() => {}))
    vi.mocked(salesApi.listSales).mockImplementation(() => new Promise<never>(() => {}))
    vi.mocked(supplierApi.listSuppliers).mockImplementation(() => new Promise<never>(() => {}))

    render(<DashboardPage onNavigate={vi.fn()} />)

    expect(screen.getByRole('status').textContent).toContain('Carregando resumo operacional...')
    expect(screen.queryByText('Resumo operacional')).toBeNull()
  })

  it('renders zero counts when all lists are empty', async () => {
    render(<DashboardPage onNavigate={vi.fn()} />)

    await screen.findByText('Resumo operacional')
    expect(screen.getAllByText('0')).toHaveLength(5)
    expect(screen.getByText('Nenhum cliente cadastrado')).toBeTruthy()
    expect(screen.getByText('Nenhuma venda registrada')).toBeTruthy()
  })

  it('shows a retryable message when one list request fails', async () => {
    vi.mocked(productApi.listProducts).mockRejectedValue(new ApiError(503, 'Backend indisponível.'))
    render(<DashboardPage onNavigate={vi.fn()} />)

    expect(await screen.findByText('Algumas informações não puderam ser carregadas. Tente novamente.')).toBeTruthy()
    expect(screen.getByText('—')).toBeTruthy()

    vi.mocked(productApi.listProducts).mockResolvedValue([])
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => expect(productApi.listProducts).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Nenhum produto cadastrado')).toBeTruthy()
  })

  it('uses the existing in-app navigation callback from shortcut links', async () => {
    const onNavigate = vi.fn()
    render(<DashboardPage onNavigate={onNavigate} />)
    await screen.findByText('Resumo operacional')

    fireEvent.click(screen.getByRole('link', { name: /Clientes/ }))
    fireEvent.click(screen.getByRole('link', { name: /Nova vendaRegistre uma venda com um ou mais produtos/ }))

    expect(onNavigate).toHaveBeenNthCalledWith(1, '/customers')
    expect(onNavigate).toHaveBeenNthCalledWith(2, '/sales/new')
  })
})
