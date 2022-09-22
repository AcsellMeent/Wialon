export const state = () => ({
    appBarVisible: true,
  })
  
  export const getters = {
    getCounter(state) {
      return state.appBarVisible
    }
  }
  
  export const mutations = {
    switchAppBarVisible(state) {
      state.appBarVisible = !state.appBarVisible
    }
  }
  
  export const actions = {
    async fetchCounter({ state }) {
      const res = { data: 10 };
      state.counter = res.data;
      return res.data;
    }
  }