<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-center">
        <img
          src="../static/logo-raw-horizontal-trimmed.png"
          alt=""
          style="width: 60%"
        />
      </div>
      <v-card>
        <v-card-title class="headline">
          Welcome to OSRSRecords.com
        </v-card-title>
        <v-card-text>
          <p>
            OSRSRecords.com is a website dedicated to tracking records in the
            Old School RuneScape community.
          </p>
        </v-card-text>
      </v-card>
      <ReleaseHistory v-if="user" class="mt-3" />
    </v-flex>
  </v-layout>
</template>

<script>
import { mapGetters } from 'vuex'
import ReleaseHistory from '~/components/common/releaseHistory.vue'

export default {
  components: {
    ReleaseHistory,
  },

  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),
  },

  methods: {},
  head() {
    return {
      title: 'Home',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'OSRSRecords.om',
        },
      ],
    }
  },
}
</script>

<style scoped>
.release {
  margin-bottom: 16px;
}
</style>
