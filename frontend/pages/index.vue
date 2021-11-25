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
        <v-card-actions>
          <v-spacer></v-spacer>
          <!--             <v-btn v-if="user" color="primary" nuxt to="/my-pb-card">
              <v-icon left> mdi-card-text </v-icon>
              Track My PBs</v-btn
            >
            <v-btn v-else nuxt to="/login" text @click="goToWcaAuth()">
              Login
            </v-btn> -->
          <v-btn color="primary" @click="openCreateSubmissionDialog()">
            <v-icon left> mdi-plus </v-icon>
            Submit Record</v-btn
          >
          <v-btn color="primary" nuxt :to="generateLeaderboardRoute()">
            <v-icon left> mdi-podium </v-icon>
            Leaderboard</v-btn
          >
        </v-card-actions>
      </v-card>
      <ReleaseHistory v-if="user" class="mt-3" />
    </v-flex>
  </v-layout>
</template>

<script>
import { mapGetters } from 'vuex'
import ReleaseHistory from '~/components/common/releaseHistory.vue'
import { handleError } from '~/services/base'
import { getEvents } from '~/services/dropdown'
import { generateLeaderboardRoute } from '~/services/common'

export default {
  components: {
    ReleaseHistory,
  },

  computed: {
    ...mapGetters({
      user: 'auth/user',
    }),
  },

  mounted() {
    // set a random image
    getEvents(this).then((events) => {
      const eventsWithBgImages = events.filter((event) => event.backgroundImage)

      if (eventsWithBgImages.length < 1) return

      this.$root.$emit('setBackgroundImage', {
        url: eventsWithBgImages[
          Math.floor(Math.random() * (eventsWithBgImages.length - 1))
        ].backgroundImage,
      })
    })
  },

  methods: {
    generateLeaderboardRoute() {
      return generateLeaderboardRoute(this)
    },
    openCreateSubmissionDialog() {
      try {
        this.$root.$emit('openEditRecordDialog', {
          recordInfo: 'Submission',
          mode: 'add',
          selectedItem: {},
        })
      } catch (err) {
        handleError(this, err)
      }
    },
  },
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
