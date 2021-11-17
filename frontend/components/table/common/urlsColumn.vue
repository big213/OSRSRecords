<template>
  <div v-if="currentValue">
    <div v-for="(url, index) in currentValue" :key="index">
      <a @click="openLink(url)"
        >{{ url }}<v-icon small class="ml-2">mdi-open-in-new</v-icon></a
      >
    </div>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { openLink } from '~/services/base'

export default {
  mixins: [columnMixin],

  methods: {
    openLink,
  },
}
</script>
