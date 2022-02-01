<template>
  <v-container fluid>
    <v-layout justify-center align-center column d-block>
      <v-row>
        <v-col cols="12" class="text-center">
          <v-card class="elevation-12">
            <v-toolbar flat color="accent" dense>
              <v-icon left>mdi-swap-horizontal</v-icon>
              <v-toolbar-title>Remap Characters</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon @click="reset()">
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card-text class="pt-3">
              <v-container class="px-0">
                <v-row>
                  <v-col
                    v-for="(inputObject, i) in inputsArray"
                    :key="i"
                    :cols="inputObject.cols || 12"
                    class="py-0"
                  >
                    <GenericInput
                      :item="inputObject"
                      :all-items="inputsArray"
                    ></GenericInput>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <slot name="footer-action"></slot>
              <v-btn
                ref="submit"
                color="primary"
                :loading="loading.submit"
                @click="submit()"
                >Submit</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-layout>
  </v-container>
</template>

<script>
import GenericInput from '~/components/input/genericInput.vue'
import { executeGiraffeql } from '~/services/giraffeql'
import {
  handleError,
  setInputValue,
  getInputValue,
  getInputObject,
} from '~/services/base'

export default {
  components: {
    GenericInput,
  },

  data() {
    return {
      loading: {
        submit: false,
      },
      inputsArray: [
        {
          fieldKey: 'from',
          label: 'From Character',
          fieldInfo: {},
          inputType: 'server-autocomplete',
          value: null,
          inputValue: null,
          clearable: false,
          inputOptions: {
            typename: 'character',
          },
          options: [],
          loading: false,
          focused: false,
          generation: 0,
          parentInput: null,
          nestedInputsArray: [],
        },
        {
          fieldKey: 'to',
          label: 'To Character',
          fieldInfo: {},
          inputType: 'server-autocomplete',
          value: null,
          inputValue: null,
          clearable: false,
          inputOptions: {
            typename: 'character',
          },
          options: [],
          loading: false,
          focused: false,
          generation: 0,
          parentInput: null,
          nestedInputsArray: [],
        },
      ],
    }
  },

  computed: {
    isLoading() {
      return Object.values(this.loading).some((ele) => ele)
    },
  },

  methods: {
    setInputValue(key, value) {
      return setInputValue(this.inputsArray, key, value)
    },

    getInputValue(key) {
      return getInputValue(this.inputsArray, key)
    },

    getInputObject(key) {
      return getInputObject(this.inputsArray, key)
    },

    async submit() {
      this.loading.submit = true
      try {
        if (!this.getInputValue('from') || !this.getInputValue('to')) {
          throw new Error('Both to and from inputs required')
        }

        await executeGiraffeql(this, {
          remapCharacter: {
            __args: {
              from: {
                id: this.getInputValue('from').id,
              },
              to: {
                id: this.getInputValue('to').id,
              },
            },
          },
        })

        this.$notifier.showSnackbar({
          message: 'Done remapping characters',
          variant: 'success',
        })

        // reset inputs
        this.reset()
      } catch (err) {
        handleError(this, err)
      }
      this.loading.submit = false
    },

    reset() {
      this.setInputValue('from', null)
      this.setInputValue('to', null)
    },
  },
}
</script>
