import { moneyTotal } from '../../utils/moneyTotal.js'
import { PURCHASEABLE_CHEESE_MAKERS } from '../../constants.js'
import { CHEESE_MAKER_AVAILABLE_NOTIFICATION } from '../../strings.js'

import { showNotification } from './showNotification.js'
import { updateLearnedRecipes } from './updateLearnedRecipes.js'

export const purchaseCheeseMaker = (
  state: farmhand.state,
  cheeseMakerId: number
): farmhand.state => {
  const { money, purchasedCheeseMaker } = state

  if (purchasedCheeseMaker >= cheeseMakerId) return state

  state = {
    ...state,
    purchasedCheeseMaker: cheeseMakerId,
    money: moneyTotal(
      money,
      -(PURCHASEABLE_CHEESE_MAKERS.get(cheeseMakerId)?.price ?? 0)
    ),
  }

  state = showNotification(state, CHEESE_MAKER_AVAILABLE_NOTIFICATION)

  return updateLearnedRecipes(state)
}
