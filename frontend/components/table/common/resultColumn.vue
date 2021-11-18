<template>
  <div :title="displayString">
    {{ displayString }}
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { serializeTime } from '~/services/common'

export default {
  mixins: [columnMixin],

  computed: {
    displayString() {
      return serializeTime(this.currentValue)
    },
  },
}
</script>
