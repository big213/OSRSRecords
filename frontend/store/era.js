import { getEras } from '~/services/dropdown'

export const state = () => ({
  currentEra: null,

  eras: [],
})

export const mutations = {
  setCurrentEra(state) {
    state.currentEra = state.eras.find((ele) => ele.isCurrent)
  },

  setEras(state, eras) {
    state.eras = eras
  },
}

export const actions = {
  async loadEras(context) {
    const eras = await getEras(this)

    context.commit('setEras', eras)

    // also reload the pinned workspaces
    context.commit('setCurrentEra')
  },
}

export const getters = {
  currentEra(state) {
    return state.currentEra
  },

  eras(state) {
    return state.eras
  },
}
