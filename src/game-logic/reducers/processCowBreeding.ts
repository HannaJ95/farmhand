import { random } from '../../common/utils.js'
import { findCowById } from '../../utils/findCowById.js'
import { generateOffspringCow } from '../../utils/generateOffspringCow.js'
import { cowColors } from '../../enums.js'
import {
  EXPERIENCE_VALUES,
  COW_GESTATION_PERIOD_DAYS,
  COW_MINIMUM_HAPPINESS_TO_BREED,
  PURCHASEABLE_COW_PENS,
  COW_TWIN_CHANCE,
} from '../../constants.js'
import { COW_BORN_MESSAGE, COW_TWINS_MESSAGE } from '../../templates.js'

import { addExperience } from './addExperience.js'

export const processCowBreeding = (state: farmhand.state): farmhand.state => {
  const {
    cowBreedingPen,
    cowInventory,
    playerId,
    newDayNotifications,
    purchasedCowPen,
  } = state
  const { cowId1, cowId2 } = cowBreedingPen

  if (!cowId2) {
    return state
  }

  const cow1 = cowId1 ? findCowById(cowInventory, cowId1) : null
  const cow2 = cowId2 ? findCowById(cowInventory, cowId2) : null

  // If either cow is not found, return state unchanged
  if (!cow1 || !cow2) {
    return state
  }

  // Same-sex couples are as valid and wonderful as any, but in this game they
  // cannot naturally produce offspring.
  if (cow1.gender === cow2.gender) {
    return state
  }

  const daysUntilBirth =
    cow1.happiness >= COW_MINIMUM_HAPPINESS_TO_BREED &&
    cow2.happiness >= COW_MINIMUM_HAPPINESS_TO_BREED
      ? cowBreedingPen.daysUntilBirth - 1
      : COW_GESTATION_PERIOD_DAYS

  const cowPenData = PURCHASEABLE_COW_PENS.get(purchasedCowPen)
  const shouldGenerateOffspring =
    cowPenData && cowInventory.length < cowPenData.cows && daysUntilBirth === 0

  const offspringCow = shouldGenerateOffspring
    ? generateOffspringCow(cow1, cow2, playerId)
    : null

  const newborns: farmhand.cow[] = offspringCow ? [offspringCow] : []

  const canGenerateTwin =
    !!offspringCow &&
    !!cowPenData &&
    cowInventory.length + newborns.length < cowPenData.cows &&
    random() <= COW_TWIN_CHANCE

  if (canGenerateTwin) {
    newborns.push(
      generateOffspringCow(cow1, cow2, playerId, {
        gender: offspringCow.gender,
        color: offspringCow.color,
        baseWeight: offspringCow.baseWeight,
      })
    )
  }

  const newCowInventory =
    newborns.length > 0 ? [...cowInventory, ...newborns] : cowInventory

  if (offspringCow) {
    const experienceGained =
      offspringCow.color === cowColors.RAINBOW
        ? EXPERIENCE_VALUES.RAINBOW_COW_BRED
        : EXPERIENCE_VALUES.COW_BRED

    state = addExperience(state, experienceGained)
  }

  const birthMessage =
    newborns.length > 1 && newborns[0] && newborns[1]
      ? COW_TWINS_MESSAGE('', cow1, cow2, newborns[0], newborns[1])
      : offspringCow
      ? COW_BORN_MESSAGE('', cow1, cow2, offspringCow)
      : ''

  return {
    ...state,
    cowInventory: newCowInventory,
    cowBreedingPen: {
      ...cowBreedingPen,
      daysUntilBirth: shouldGenerateOffspring
        ? COW_GESTATION_PERIOD_DAYS
        : daysUntilBirth,
    },
    newDayNotifications: birthMessage
      ? [
          ...newDayNotifications,
          {
            message: birthMessage,
            severity: 'success',
          },
        ]
      : newDayNotifications,
  }
}
