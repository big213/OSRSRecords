<template>
  <div>
    <a
      v-if="currentValue.firstImageLink"
      @click.stop="openLink(currentValue.firstImageLink)"
      ><v-icon small>mdi-image</v-icon></a
    >
    <a
      v-if="currentValue.firstVideoLink"
      @click.stop="openLink(currentValue.firstVideoLink)"
      ><v-icon small>mdi-video</v-icon></a
    >
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
  computed: {},
}
</script>
