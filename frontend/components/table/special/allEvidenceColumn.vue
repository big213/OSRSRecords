<template>
  <div style="white-space: initial">
    <a v-for="(link, i) in currentValue" @click.stop="openLink(link.main)"
      ><v-icon small
        >{{ isVideoUrl(link.main) ? 'mdi-video' : 'mdi-image' }}
      </v-icon></a
    >
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { openLink } from '~/services/base'
import { isVideoUrl } from '~/services/common'

export default {
  mixins: [columnMixin],

  methods: {
    openLink,
    isVideoUrl,
  },
  computed: {},
}
</script>
