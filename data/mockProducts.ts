import type { Product } from '~/types'

export const mockProducts: Product[] = [
  {
    id: 1,
    attributes: {
      name: 'BPC-157',
      slug: 'bpc-157',
      shortDescription: 'Body Protection Compound-157, a synthetic peptide for research applications.',
      description: 'BPC-157 is a synthetic peptide that has been the subject of numerous research studies. It consists of 15 amino acids and is a partial sequence of body protection compound (BPC) found in human gastric juice. This product is intended for research purposes only.',
      active: true,
      requiresConfirmation: true,
      badgeText: 'Research Use Only',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      variants: {
        data: [
          {
            id: 1,
            attributes: {
              name: '5mg',
              sku: 'BPC157-5MG',
              price: 39.99,
              active: true,
              inventory: 100,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            id: 2,
            attributes: {
              name: '10mg',
              sku: 'BPC157-10MG',
              price: 69.99,
              active: true,
              inventory: 50,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      },
    },
  },
  {
    id: 2,
    attributes: {
      name: 'TB-500',
      slug: 'tb-500',
      shortDescription: 'Thymosin Beta-4 fragment for laboratory research.',
      description: 'TB-500 is a synthetic fraction of the protein thymosin beta-4, which is present in virtually all human and animal cells. This peptide has been extensively studied in research settings. For research use only.',
      active: true,
      requiresConfirmation: true,
      badgeText: 'Research Use Only',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      variants: {
        data: [
          {
            id: 3,
            attributes: {
              name: '2mg',
              sku: 'TB500-2MG',
              price: 29.99,
              active: true,
              inventory: 75,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            id: 4,
            attributes: {
              name: '5mg',
              sku: 'TB500-5MG',
              price: 59.99,
              active: true,
              inventory: 60,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            id: 5,
            attributes: {
              name: '10mg',
              sku: 'TB500-10MG',
              price: 99.99,
              active: true,
              inventory: 30,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      },
    },
  },
  {
    id: 3,
    attributes: {
      name: 'Ipamorelin',
      slug: 'ipamorelin',
      shortDescription: 'Growth hormone secretagogue peptide for research.',
      description: 'Ipamorelin is a pentapeptide and growth hormone secretagogue. It has been studied for its selective stimulation of growth hormone release. This product is strictly for laboratory research purposes.',
      active: true,
      requiresConfirmation: true,
      badgeText: 'Research Use Only',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      variants: {
        data: [
          {
            id: 6,
            attributes: {
              name: '2mg',
              sku: 'IPA-2MG',
              price: 24.99,
              active: true,
              inventory: 120,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            id: 7,
            attributes: {
              name: '5mg',
              sku: 'IPA-5MG',
              price: 49.99,
              active: true,
              inventory: 80,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      },
    },
  },
  {
    id: 4,
    attributes: {
      name: 'CJC-1295',
      slug: 'cjc-1295',
      shortDescription: 'Modified growth hormone releasing hormone analog.',
      description: 'CJC-1295 is a synthetic analog of growth hormone-releasing hormone (GHRH). It has been modified to increase its half-life and stability. For research applications only.',
      active: true,
      requiresConfirmation: true,
      badgeText: 'Research Use Only',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      variants: {
        data: [
          {
            id: 8,
            attributes: {
              name: '2mg',
              sku: 'CJC-2MG',
              price: 34.99,
              active: true,
              inventory: 90,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            id: 9,
            attributes: {
              name: '5mg',
              sku: 'CJC-5MG',
              price: 74.99,
              active: true,
              inventory: 45,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      },
    },
  },
  {
    id: 5,
    attributes: {
      name: 'Melanotan II',
      slug: 'melanotan-ii',
      shortDescription: 'Synthetic analog of alpha-melanocyte stimulating hormone.',
      description: 'Melanotan II is a synthetic analog of the peptide hormone alpha-melanocyte stimulating hormone (α-MSH). It has been studied in various research contexts. Strictly for research purposes.',
      active: true,
      requiresConfirmation: true,
      badgeText: 'Research Use Only',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      variants: {
        data: [
          {
            id: 10,
            attributes: {
              name: '10mg',
              sku: 'MT2-10MG',
              price: 44.99,
              active: true,
              inventory: 55,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      },
    },
  },
  {
    id: 6,
    attributes: {
      name: 'Sermorelin',
      slug: 'sermorelin',
      shortDescription: 'Growth hormone-releasing hormone (GHRH) analog.',
      description: 'Sermorelin is a synthetic version of a naturally occurring substance that causes the release of growth hormone from the pituitary gland. For laboratory research only.',
      active: true,
      requiresConfirmation: true,
      badgeText: 'Research Use Only',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      variants: {
        data: [
          {
            id: 11,
            attributes: {
              name: '2mg',
              sku: 'SERM-2MG',
              price: 29.99,
              active: true,
              inventory: 70,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            id: 12,
            attributes: {
              name: '5mg',
              sku: 'SERM-5MG',
              price: 59.99,
              active: true,
              inventory: 40,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      },
    },
  },
  {
    id: 7,
    attributes: {
      name: 'GHK-Cu',
      slug: 'ghk-cu',
      shortDescription: 'Copper peptide complex for research applications.',
      description: 'GHK-Cu is a naturally occurring copper complex of the tripeptide glycyl-L-histidyl-L-lysine. It has been the subject of extensive research. For research use only.',
      active: true,
      requiresConfirmation: true,
      badgeText: 'Research Use Only',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      variants: {
        data: [
          {
            id: 13,
            attributes: {
              name: '50mg',
              sku: 'GHKCU-50MG',
              price: 54.99,
              active: true,
              inventory: 65,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            id: 14,
            attributes: {
              name: '100mg',
              sku: 'GHKCU-100MG',
              price: 89.99,
              active: true,
              inventory: 35,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      },
    },
  },
  {
    id: 8,
    attributes: {
      name: 'Epithalon',
      slug: 'epithalon',
      shortDescription: 'Synthetic tetrapeptide for telomere research.',
      description: 'Epithalon (Epitalon) is a synthetic version of the polypeptide Epithalamin. It has been studied in the context of telomere and aging research. For research purposes only.',
      active: true,
      requiresConfirmation: true,
      badgeText: 'Research Use Only',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      variants: {
        data: [
          {
            id: 15,
            attributes: {
              name: '10mg',
              sku: 'EPITH-10MG',
              price: 39.99,
              active: true,
              inventory: 85,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            id: 16,
            attributes: {
              name: '50mg',
              sku: 'EPITH-50MG',
              price: 149.99,
              active: true,
              inventory: 25,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      },
    },
  },
]
