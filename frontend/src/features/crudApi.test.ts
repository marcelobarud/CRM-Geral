import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, getApiErrorMessage } from '../services/httpClient'
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from './customers/api'
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from './employees/api'
import {
  createProduct,
  deleteProduct,
  listProductSuppliers,
  listProducts,
  updateProduct,
} from './products/api'
import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from './suppliers/api'

const customer = {
  id: 1,
  nome: 'Ana Silva',
  cidade: 'São Paulo',
  estado: 'SP',
  rua: 'Rua A',
  numero: '10',
  complemento: null,
}

const supplier = {
  id: 2,
  nome: 'Fornecedor A',
  cidade: 'Campinas',
  estado: 'SP',
  rua: 'Rua B',
  numero: '20',
  complemento: null,
  cnpj: '12.345.678/0001-90',
}

const employee = {
  id: 3,
  nome_completo: 'Carlos Souza',
  cidade: 'Santos',
  estado: 'SP',
  rua: 'Rua C',
  numero: '30',
  complemento: null,
  cpf: '123.456.789-00',
  rg: null,
  data_nascimento: '1990-01-01',
  ativo: true,
}

const product = {
  id: 4,
  nome: 'Produto A',
  categoria: 'Categoria A',
  preco_custo: '10.50',
  preco_venda: '18.90',
  fornecedor_id: supplier.id,
}

const { id: _customerId, ...customerPayload } = customer
const { id: _supplierId, ...supplierPayload } = supplier
const { id: _employeeId, ativo: _employeeActive, ...employeePayload } = employee
const { id: _productId, ...productPayload } = product

function response(body: unknown, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockFetch(result: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(result)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('customers API', () => {
  it('supports list, create, update and delete with the expected contract', async () => {
    const fetchMock = mockFetch(response([customer]))

    await expect(listCustomers()).resolves.toEqual([customer])
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8000/api/customers',
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) }),
    )

    fetchMock.mockResolvedValueOnce(response(customer))
    await createCustomer(customerPayload)
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8000/api/customers',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Ana Silva'),
      }),
    )

    fetchMock.mockResolvedValueOnce(response(customer))
    await updateCustomer(customer.id, { cidade: 'Osasco' })
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8000/api/customers/1',
      expect.objectContaining({ method: 'PATCH', body: '{"cidade":"Osasco"}' }),
    )

    fetchMock.mockResolvedValueOnce(response(null, 204))
    await expect(deleteCustomer(customer.id)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8000/api/customers/1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})

describe('suppliers API', () => {
  it('keeps duplicate CNPJ errors available to the UI', async () => {
    const fetchMock = mockFetch(response({ detail: 'CNPJ já cadastrado.' }, 409))

    await expect(createSupplier(supplierPayload)).rejects.toMatchObject({
      status: 409,
      message: 'CNPJ já cadastrado.',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/suppliers',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('supports list, update and related-product delete errors', async () => {
    const fetchMock = mockFetch(response([supplier]))
    await expect(listSuppliers()).resolves.toEqual([supplier])

    fetchMock.mockResolvedValueOnce(response(supplier))
    await expect(updateSupplier(supplier.id, { nome: 'Fornecedor atualizado' })).resolves.toEqual(supplier)

    fetchMock.mockResolvedValueOnce(response({ detail: 'Fornecedor possui produtos relacionados e não pode ser excluído.' }, 409))
    await expect(deleteSupplier(supplier.id)).rejects.toBeInstanceOf(ApiError)
  })
})

describe('employees API', () => {
  it('preserves nullable optional fields when creating and updating', async () => {
    const fetchMock = mockFetch(response([employee]))
    await expect(listEmployees()).resolves.toEqual([employee])
    fetchMock.mockResolvedValueOnce(response(employee))
    const payload = { ...employeePayload, rg: null, complemento: null }

    await expect(createEmployee(payload)).resolves.toEqual(employee)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/employees',
      expect.objectContaining({ body: expect.stringContaining('"rg":null') }),
    )

    fetchMock.mockResolvedValueOnce(response(employee))
    await expect(updateEmployee(employee.id, { rg: null })).resolves.toEqual(employee)

    fetchMock.mockResolvedValueOnce(response(null, 204))
    await expect(deleteEmployee(employee.id)).resolves.toBeUndefined()
  })

  it('supports the active-only listing used by new sales', async () => {
    const fetchMock = mockFetch(response([employee]))
    await expect(listEmployees(true)).resolves.toEqual([employee])
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/employees?active=true',
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) }),
    )
  })

  it('exposes duplicate CPF errors without replacing them with a generic message', async () => {
    mockFetch(response({ detail: 'CPF já cadastrado.' }, 409))
    await expect(createEmployee(employeePayload)).rejects.toMatchObject({ message: 'CPF já cadastrado.' })
  })
})

describe('products API', () => {
  it('loads real suppliers for the product relationship', async () => {
    const fetchMock = mockFetch(response([supplier]))
    await expect(listProductSuppliers()).resolves.toEqual([supplier])
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/suppliers',
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) }),
    )
  })

  it('supports listing products before opening the CRUD screen', async () => {
    const fetchMock = mockFetch(response([product]))
    await expect(listProducts()).resolves.toEqual([product])
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/products',
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) }),
    )
  })

  it('keeps decimal prices as submitted strings and surfaces 422 validation', async () => {
    const fetchMock = mockFetch(response(product))
    await expect(createProduct({ ...productPayload, preco_custo: '10.50', preco_venda: '18.90' })).resolves.toEqual(product)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/products',
      expect.objectContaining({ body: expect.stringContaining('"preco_custo":"10.50"') }),
    )

    fetchMock.mockResolvedValueOnce(response(product))
    await expect(updateProduct(product.id, { preco_venda: '19.00' })).resolves.toEqual(product)

    fetchMock.mockResolvedValueOnce(response({ detail: 'Input deve ser maior ou igual a 0.' }, 422))
    await expect(createProduct({ ...productPayload, preco_custo: '-1', preco_venda: '18.90' })).rejects.toMatchObject({ status: 422 })
  })

  it('keeps relationship delete conflicts available to the UI', async () => {
    mockFetch(response({ detail: 'Produto possui itens de venda relacionados e não pode ser excluído.' }, 409))
    const error = await deleteProduct(product.id).catch((value: unknown) => value)
    expect(getApiErrorMessage(error, 'fallback')).toContain('itens de venda relacionados')
  })
})
