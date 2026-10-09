import React from 'react'
import { render, screen } from '@testing-library/react'

import { INFINITE_STORAGE_LIMIT } from '../../constants.js'
import { itemType, stageFocusType } from '../../enums.js'
import { noop } from '../../utils/noop.js'
import { SHOP_INVENTORY_FULL_BANNER } from '../../strings.js'

import FarmhandContext, {
  createContextData,
} from '../Farmhand/Farmhand.context.js'

import Shop from './Shop.js'

const baseGameState = {
  inventory: [] as farmhand.state['inventory'],
  inventoryLimit: INFINITE_STORAGE_LIMIT,

  money: 0,
  purchasedCombine: 0,
  purchasedCowPen: 0,
  purchasedCellar: 0,
  purchasedSmelter: 0,
  purchasedField: 0,
  shopInventory: [] as farmhand.item[],
  valueAdjustments: {},
}

const baseHandlers = {
  handleCombinePurchase: noop,
  handleCowPenPurchase: noop,
  handleCellarPurchase: noop,
  handleFieldPurchase: noop,
  handleStorageExpansionPurchase: noop,
}

const sampleSapling = {
  id: 'sample-sapling',
  name: 'Sample Sapling',
  type: itemType.TREE,
  isPlantableTree: true,
} as farmhand.item

const renderShop = (
  gameStateOverrides: Partial<typeof baseGameState> = {},
  { isForestUnlocked = false }: { isForestUnlocked?: boolean } = {}
) => {
  const contextValue = createContextData()

  contextValue.gameState = {
    ...contextValue.gameState,
    ...baseGameState,
    ...gameStateOverrides,
    levelEntitlements: {
      ...contextValue.gameState.levelEntitlements,
      stageFocusType: {
        ...contextValue.gameState.levelEntitlements.stageFocusType,
        [stageFocusType.FOREST]: isForestUnlocked,
      },
    },
  }
  contextValue.handlers = { ...contextValue.handlers, ...baseHandlers }

  render(
    <FarmhandContext.Provider value={contextValue}>
      <Shop />
    </FarmhandContext.Provider>
  )
}

describe('<Shop />', () => {
  describe('without any saplings in the shop inventory', () => {
    beforeEach(() => {
      renderShop()
    })

    test.each(['Seeds', 'Supplies', 'Upgrades'])(
      'the %s tab exists',
      (tabLabel: string) => {
        expect(screen.getByText(tabLabel)).toBeInTheDocument()
      }
    )

    test('the Saplings tab does not exist', () => {
      expect(screen.queryByText('Saplings')).not.toBeInTheDocument()
    })
  })

  describe('with a sapling in the shop inventory, Forest unlocked', () => {
    beforeEach(() => {
      renderShop({ shopInventory: [sampleSapling] }, { isForestUnlocked: true })
    })

    test.each(['Seeds', 'Saplings', 'Supplies', 'Upgrades'])(
      'the %s tab exists',
      (tabLabel: string) => {
        expect(screen.getByText(tabLabel)).toBeInTheDocument()
      }
    )
  })

  describe('with a sapling in the shop inventory, Forest not yet unlocked', () => {
    beforeEach(() => {
      renderShop({ shopInventory: [sampleSapling] })
    })

    test('the Saplings tab does not exist', () => {
      expect(screen.queryByText('Saplings')).not.toBeInTheDocument()
    })
  })

  describe('inventory full banner', () => {
    test('is not shown when storage is infinite', () => {
      renderShop({ inventoryLimit: INFINITE_STORAGE_LIMIT })

      expect(
        screen.queryByText(SHOP_INVENTORY_FULL_BANNER)
      ).not.toBeInTheDocument()
    })

    test('is not shown when inventory space remains', () => {
      renderShop({
        inventory: [{ id: 'carrot', quantity: 5 }],
        inventoryLimit: 10,
      })

      expect(
        screen.queryByText(SHOP_INVENTORY_FULL_BANNER)
      ).not.toBeInTheDocument()
    })

    test('is shown when inventory is full', () => {
      renderShop({
        inventory: [{ id: 'carrot', quantity: 5 }],
        inventoryLimit: 5,
      })

      expect(screen.getByText(SHOP_INVENTORY_FULL_BANNER)).toBeInTheDocument()
    })
  })
})
