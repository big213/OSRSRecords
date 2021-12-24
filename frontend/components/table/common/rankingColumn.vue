<template>
  <div>
    <span
      v-if="placeEmojisMap[currentValue]"
      :title="placeEmojisMap[currentValue].text"
      >{{ placeEmojisMap[currentValue].emoji }}</span
    >
    <span v-else>{{ currentValue }}</span>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { placeEmojisMap } from '~/services/constants'

export default {
  mixins: [columnMixin],

  data() {
    return {
      placeEmojisMap,
    }
  },
}
</script>
