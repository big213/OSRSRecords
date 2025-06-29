<template>
  <div :title="timeString">
    {{ timeString }}
  </div>
</template>

<script>
import { generateDateLocaleString } from '~/services/base'
import columnMixin from '~/mixins/column'

export default {
  mixins: [columnMixin],

  computed: {
    timeString() {
      return `${generateDateLocaleString(this.item.beginDate)} - ${
        this.item.endDate ? generateDateLocaleString(this.item.endDate) : 'None'
      }`
    },
  },
}
</script>
