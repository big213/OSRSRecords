export default (context) => {
  const { store } = context

  return store.dispatch('era/loadEras')
}
