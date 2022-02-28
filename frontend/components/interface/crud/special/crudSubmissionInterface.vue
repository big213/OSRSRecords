<template>
  <div :class="{ 'expanded-table-bg': isChildComponent }">
    <v-toolbar flat color="accent" dense>
      <v-icon left>{{ icon || recordInfo.icon || 'mdi-domain' }}</v-icon>
      <v-toolbar-title>{{
        title || `${recordInfo.pluralName}`
      }}</v-toolbar-title>
      <v-divider
        v-if="recordInfo.addOptions"
        class="mx-4"
        inset
        vertical
      ></v-divider>
      <v-btn
        v-if="recordInfo.addOptions"
        color="primary"
        @click="openAddRecordDialog()"
      >
        <v-icon left>mdi-plus</v-icon>
        New
      </v-btn>
      <v-divider
        v-if="recordInfo.paginationOptions.hasSearch"
        class="mx-4"
        inset
        vertical
      ></v-divider>
      <SearchDialog
        v-if="recordInfo.paginationOptions.hasSearch"
        v-model="searchInput"
        @handleSubmit="handleSearchDialogSubmit"
      >
        <template slot="icon">
          <v-badge :value="!!search" dot color="secondary">
            <v-icon>mdi-magnify</v-icon>
          </v-badge>
        </template>
      </SearchDialog>
      <v-spacer></v-spacer>
      <v-menu v-if="sortOptions.length > 0" offset-y left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            :text="!isXsViewport"
            :icon="isXsViewport"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon :left="!isXsViewport">mdi-sort</v-icon>
            <span v-if="!isXsViewport"
              >Sort By: {{ currentSort ? currentSort.text : 'None' }}</span
            ></v-btn
          >
        </template>
        <v-list dense>
          <v-list-item
            v-for="(crudSortObject, index) in sortOptions"
            :key="index"
            :class="{ 'selected-bg': currentSort === crudSortObject }"
            @click="setCurrentSort(crudSortObject)"
          >
            <v-list-item-title>{{ crudSortObject.text }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-switch
        v-if="pollInterval > 0"
        v-model="isPolling"
        class="mt-5"
        label="Auto-Refresh"
      ></v-switch>

      <v-btn
        v-if="hasFilters"
        icon
        @click="showFilterInterface = !showFilterInterface"
      >
        <v-badge
          :value="visibleFiltersCount"
          :content="visibleFiltersCount"
          color="secondary"
        >
          <v-icon>mdi-filter-menu</v-icon>
        </v-badge>
      </v-btn>
      <v-btn icon @click="toggleGridMode()">
        <v-icon>{{ isGrid ? 'mdi-view-list' : 'mdi-view-grid' }}</v-icon>
      </v-btn>
      <v-btn
        v-if="recordInfo.importOptions"
        icon
        @click="openImportRecordDialog()"
      >
        <v-icon>mdi-upload</v-icon>
      </v-btn>
      <v-btn
        v-if="recordInfo.paginationOptions.downloadOptions"
        icon
        :loading="loading.exportData"
        @click="exportData()"
      >
        <v-icon>mdi-download</v-icon>
      </v-btn>
      <v-btn
        :loading="loading.loadData || loading.syncData"
        icon
        @click="reset()"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
      <slot name="header-action"></slot>
    </v-toolbar>
    <v-container v-if="showFilterInterface" fluid class="pb-0 mt-3">
      <v-row>
        <v-col
          v-if="recordInfo.paginationOptions.hasSearch"
          :key="-1"
          cols="12"
          lg="3"
          class="py-0"
        >
          <v-text-field
            v-model="searchInput"
            label="Search"
            placeholder="Type to search"
            outlined
            prepend-icon="mdi-magnify"
            clearable
            @click:clear="handleClearSearch()"
            @keyup.enter="updatePageOptions()"
          ></v-text-field>
        </v-col>
        <v-col
          v-for="(crudFilterObject, i) in visibleFiltersArray"
          :key="i"
          cols="12"
          lg="3"
          class="py-0"
        >
          <GenericInput
            :item="crudFilterObject.inputObject"
            @change="updatePageOptions"
            @handle-input="filterChanged = true"
          ></GenericInput>
        </v-col>
      </v-row>
      <v-toolbar v-if="filterChanged" dense flat color="transparent">
        <v-spacer></v-spacer>
        <v-btn color="primary" class="mb-2" @click="updatePageOptions()">
          <v-icon left>mdi-filter</v-icon>
          Update Filters
        </v-btn>
      </v-toolbar>
    </v-container>
    <v-card class="text-center">
      <span v-if="isDataLoading">...</span>
      <span v-else-if="!totalRecords">---</span>
      <span v-else>
        (Showing {{ records.length }} of {{ totalRecords }}
        {{ recordInfo.pluralName }})
      </span>
    </v-card>
    <v-divider />

    <v-data-iterator
      v-if="isGrid"
      :items="records"
      disable-sort
      disable-pagination
      hide-default-footer
      class="pt-5 elevation-1"
      :loading="loading.loadData"
    >
      <template v-slot:loading>
        <v-progress-linear indeterminate></v-progress-linear>
      </template>
      <template v-slot:default="props">
        <v-container fluid>
          <v-row>
            <v-col
              v-for="item in props.items"
              :key="item.id"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <v-card @click="handleRowClick(item)">
                <!--
                <v-card-title class="subheading font-weight-bold">
                {{ item.name }}
              </v-card-title>
              <v-divider></v-divider>
              -->
                <v-list dense>
                  <v-list-item
                    v-for="(headerItem, j) in headerOptions"
                    :key="j"
                  >
                    <v-list-item-content
                      >{{ headerItem.text }}:</v-list-item-content
                    >
                    <v-list-item-content class="text-right truncate-mobile-row">
                      <component
                        :is="headerItem.fieldInfo.component"
                        v-if="headerItem.fieldInfo.component"
                        :item="item"
                        :options="headerItem.fieldInfo.columnOptions"
                        :field-path="headerItem.path"
                        @submit="reset({ resetExpanded: false })"
                        @item-updated="reset({ resetExpanded: false })"
                      ></component>
                      <span v-else>
                        {{ getTableRowData(headerItem, item) }}
                      </span>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
                <v-divider />
                <div class="text-center" style="width: 100%">
                  <RecordActionMenu
                    :record-info="recordInfo"
                    :item="item"
                    expand-mode="emit"
                    bottom
                    offset-y
                    @handle-action-click="openEditDialog"
                    @handle-expand-click="openExpandDialog(item, ...$event)"
                    @handle-custom-action-click="handleCustomActionClick"
                    @reload-parent="reset({ resetExpanded: false })"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn block text v-bind="attrs" v-on="on">
                        Actions
                      </v-btn>
                    </template>
                  </RecordActionMenu>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12">
              <div class="text-center">
                <v-divider></v-divider>
                <v-btn
                  v-if="records.length < totalRecords"
                  text
                  block
                  :loading="loading.loadMore"
                  @click="loadMore()"
                  >View More</v-btn
                >
                <span v-if="isDataLoading">...</span>
                <span v-else-if="!totalRecords">---</span>
                <span v-else>
                  (Showing {{ records.length }} of {{ totalRecords }}
                  {{ recordInfo.pluralName }})
                </span>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </v-data-iterator>
    <v-data-table
      v-else
      :headers="headerOptions"
      :items="records"
      class="elevation-1"
      :loading="loading.loadData"
      loading-text="Loading... Please wait"
      :server-items-length="totalRecords"
      :dense="dense"
      :expanded.sync="expandedItems"
      :single-expand="hasNested"
      hide-default-footer
    >
      <template v-slot:item="props">
        <tr
          v-if="props.isMobile"
          :key="props.item.id"
          class="v-data-table__mobile-table-row"
          @click="handleRowClick(props.item)"
        >
          <td
            v-for="(headerItem, i) in headerOptions"
            :key="i"
            class="v-data-table__mobile-row"
          >
            <div
              v-if="headerItem.value === null"
              class="text-center"
              style="width: 100%"
            >
              <v-divider />
              <RecordActionMenu
                :record-info="recordInfo"
                :item="props.item"
                expand-mode="emit"
                bottom
                offset-y
                @handle-action-click="openEditDialog"
                @handle-expand-click="openExpandDialog(props.item, ...$event)"
                @handle-custom-action-click="handleCustomActionClick"
                @reload-parent="reset({ resetExpanded: false })"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-btn block text v-bind="attrs" v-on="on"> Actions </v-btn>
                </template>
              </RecordActionMenu>
            </div>
            <template v-else>
              <div class="v-data-table__mobile-row__header">
                {{ headerItem.text }}
              </div>
              <div class="v-data-table__mobile-row__cell truncate-mobile-row">
                <component
                  :is="headerItem.fieldInfo.component"
                  v-if="headerItem.fieldInfo.component"
                  :item="props.item"
                  :options="headerItem.fieldInfo.columnOptions"
                  :field-path="headerItem.path"
                  @submit="reset({ resetExpanded: false })"
                  @item-updated="reset({ resetExpanded: false })"
                ></component>
                <span v-else>
                  {{ getTableRowData(headerItem, props.item) }}
                </span>
              </div>
            </template>
          </td>
        </tr>
        <tr
          v-else
          :key="props.item.id"
          :class="{
            'expanded-row-bg': props.isExpanded,
          }"
          @click="handleRowClick(props.item)"
        >
          <td
            v-for="(headerItem, i) in headerOptions"
            :key="i"
            :class="headerItem.align ? 'text-' + headerItem.align : null"
            class="truncate"
          >
            <div v-if="headerItem.value === null">
              <RecordActionMenu
                :record-info="recordInfo"
                :item="props.item"
                expand-mode="emit"
                left
                offset-x
                @handle-action-click="openEditDialog"
                @handle-expand-click="toggleItemExpanded(props, ...$event)"
                @handle-custom-action-click="handleCustomActionClick"
                @reload-parent="reset({ resetExpanded: false })"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-icon small v-bind="attrs" v-on="on"
                    >mdi-dots-vertical</v-icon
                  >
                </template>
              </RecordActionMenu>
            </div>
            <span v-else>
              <component
                :is="headerItem.fieldInfo.component"
                v-if="headerItem.fieldInfo.component"
                :item="props.item"
                :options="headerItem.fieldInfo.columnOptions"
                :field-path="headerItem.path"
                @submit="reset({ resetExpanded: false })"
                @item-updated="reset({ resetExpanded: false })"
              ></component>
              <span v-else>
                {{ getTableRowData(headerItem, props.item) }}
              </span>
            </span>
          </td>
        </tr>
      </template>
      <template v-slot:footer>
        <div class="text-center">
          <v-divider></v-divider>
          <v-btn
            v-if="records.length < totalRecords"
            text
            block
            :loading="loading.loadMore"
            @click="loadMore()"
            >View More</v-btn
          >
          <span v-if="isDataLoading">...</span>
          <span v-else-if="!totalRecords">---</span>
          <span v-else>
            (Showing {{ records.length }} of {{ totalRecords }}
            {{ recordInfo.pluralName }})
          </span>
        </div>
      </template>

      <template v-if="hasNested" v-slot:expanded-item="{ headers }">
        <td :colspan="headers.length" class="pr-0">
          <component
            :is="childInterfaceComponent"
            class="mb-2"
            :record-info="expandTypeObject.recordInfo"
            :icon="expandTypeObject.icon"
            :title="expandTypeObject.name"
            :hidden-headers="expandTypeObject.excludeHeaders"
            :locked-filters="lockedSubFilters"
            :page-options="subPageOptions"
            :hidden-filters="hiddenSubFilters"
            is-child-component
            :dense="dense"
            @pageOptions-updated="handleSubPageOptionsUpdated"
            @record-changed="reset({ resetExpanded: false })"
          >
            <template v-slot:header-action>
              <v-btn icon @click="closeExpandedItems()">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
          </component>
        </td>
      </template>
      <template v-slot:no-data>No records</template>
    </v-data-table>
    <EditRecordDialog
      :status="dialogs.editRecord"
      :record-info="recordInfo"
      :selected-item="dialogs.selectedItem"
      :mode="dialogs.editMode"
      @close="dialogs.editRecord = false"
      @handleSubmit="handleListChange()"
      @item-updated="handleListChange()"
    ></EditRecordDialog>
    <v-dialog v-model="dialogs.expandRecord">
      <v-card flat>
        <component
          :is="childInterfaceComponent"
          v-if="dialogs.expandRecord && expandTypeObject"
          :record-info="expandTypeObject.recordInfo"
          :icon="expandTypeObject.icon"
          :title="expandTypeObject.name"
          :hidden-headers="expandTypeObject.excludeHeaders"
          :locked-filters="lockedSubFilters"
          :page-options="subPageOptions"
          :hidden-filters="hiddenSubFilters"
          is-child-component
          :dense="dense"
          @pageOptions-updated="handleSubPageOptionsUpdated"
          @record-changed="reset({ resetExpanded: false })"
        >
          <template v-slot:header-action>
            <v-btn icon @click="dialogs.expandRecord = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </component>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import crudMixin from '~/mixins/crud'
import { executeGiraffeql } from '~/services/giraffeql'
import {
  handleError,
  getPaginatorData,
  serializeNestedProperty,
  processQuery,
} from '~/services/base'

// changed
const requiredFilters = ['event']

export default {
  name: 'CrudRecordInterface',

  mixins: [crudMixin],

  computed: {
    // changed
    isRankMode() {
      let rankMode = false
      if (this.currentSort?.field === 'score') {
        rankMode =
          requiredFilters.every((field) => {
            return this.allFilters.find(
              (rawFilterObject) => rawFilterObject.field === field
            )
          }) &&
          this.allFilters.find(
            (rawFilterObject) => rawFilterObject.field === 'status'
          )?.value === 'APPROVED'
      }
      return rankMode
    },

    // changed
    isRelevantRecordMode() {
      let isMode = false
      if (this.currentSort?.field === 'happenedOn') {
        isMode =
          requiredFilters.every((field) => {
            return this.allFilters.find(
              (rawFilterObject) => rawFilterObject.field === field
            )
          }) &&
          this.allFilters.find(
            (rawFilterObject) => rawFilterObject.field === 'isRelevantRecord'
          )?.value === true &&
          this.allFilters.find(
            (rawFilterObject) => rawFilterObject.field === 'status'
          )?.value === 'APPROVED'
      }

      return isMode
    },
  },

  methods: {
    // added
    populateRankings() {
      if (this.records.length < 1) return

      // changed: go through all of the entries and populate the ranking field based on the first entry's ranking
      if (this.isRankMode) {
        const firstResultRanking = this.records[0].ranking

        let placeDiff = 0

        this.records.forEach((record, index) => {
          this.$set(
            record,
            'ranking',
            firstResultRanking === null
              ? null
              : this.currentSort.desc
              ? firstResultRanking - placeDiff
              : firstResultRanking + placeDiff
          )

          // check the next record and see if it exists and the score is not the same
          if (
            this.records[index + 1] &&
            record.score !== this.records[index + 1].score
          ) {
            // if it is, increment placeDiff. else, do not
            placeDiff++
          }
        })
      }
    },

    // added
    populateDaysRecordStoodFields() {
      if (this.records.length < 1) return

      // go through the records and populate the isRelevantRecord AND supersedingRecord.happenedOn fields
      const records = this.currentSort.desc
        ? this.records.slice().reverse()
        : this.records

      records.forEach((record, index) => {
        if (record.supersedingRecord) return

        this.$set(record, 'isRelevantRecord', true)
        this.$set(
          record,
          'supersedingRecord',
          records[index + 1]
            ? { happenedOn: records[index + 1].happenedOn }
            : null
        )
      })
    },

    // changed: also need to fetch ranking of the first row, then populate the rankings
    async loadInitialData(showLoader = true, currentReloadGeneration) {
      this.endCursor = null
      this.loading.syncData = true
      if (showLoader) this.loading.loadData = true
      try {
        const results = await this.fetchData()

        // if reloadGeneration is behind the latest one, do not load the results into this.records, as the loadData request has been superseded
        if (currentReloadGeneration < this.reloadGeneration) return

        // changed: if any rows AND in isRankMode, fetch and set the ranking of the first row
        if (results.edges.length > 0 && this.isRankMode) {
          // temporarily store records, as we need to modify it before it appears in the table results
          const records = results.edges.map((ele) => ele.node)

          const hasParticipantsFilter = !!this.allFilters.find(
            (rawFilterObject) => rawFilterObject.field === 'participants'
          )

          const hasEventEraFilter = !!this.allFilters.find(
            (rawFilterObject) => rawFilterObject.field === 'eventEra'
          )

          const isRelevantEventEraFilter = this.allFilters.find(
            (rawFilterObject) => rawFilterObject.field === 'eventEra.isRelevant'
          )

          const isSoloPersonalBestFilter = this.allFilters.find(
            (rawFilterObject) =>
              rawFilterObject.field === 'isSoloPersonalBest' &&
              rawFilterObject.value !== '__undefined'
          )

          const rankResults = await executeGiraffeql(this, {
            getSubmission: {
              ranking: {
                __args: {
                  excludeParticipants: !hasParticipantsFilter,
                  excludeEventEra: !hasEventEraFilter,
                  isRelevantEventEra: isRelevantEventEraFilter?.value ?? null,
                  isSoloPersonalBest: isSoloPersonalBestFilter?.value ?? null,
                },
              },
              __args: {
                id: records[0].id,
              },
            },
          })
          this.$set(records[0], 'ranking', rankResults.ranking)

          // sync records only at this point, after rank is done loading
          this.records = records

          this.populateRankings()
        } else {
          this.records = results.edges.map((ele) => ele.node)

          if (this.isRelevantRecordMode) {
            this.populateDaysRecordStoodFields()
          }
        }

        this.totalRecords = results.paginatorInfo.total
        this.endCursor = results.paginatorInfo.endCursor
      } catch (err) {
        handleError(this, err)
      }
      this.loading.syncData = false
      if (showLoader) this.loading.loadData = false
    },

    async loadMore() {
      // save snapshot of currentReloadGeneration
      const currentReloadGeneration = this.reloadGeneration

      this.loading.loadMore = true
      try {
        const results = await this.fetchData()

        // if reloadGeneration is behind the latest one, do not load the results into this.records, as the loadData request has been superseded
        if (currentReloadGeneration < this.reloadGeneration) return

        this.records.push(...results.edges.map((ele) => ele.node))

        // changed: if any rows AND in isRankMode, populate the ranking field based on the first row
        if (this.isRankMode) {
          this.populateRankings()
        }

        // changed: if any rows AND in isRelevantRecordMode, populate the necessary fields for daysRecordStood field
        if (this.isRelevantRecordMode) {
          this.populateDaysRecordStoodFields()
        }

        this.totalRecords = results.paginatorInfo.total
        this.endCursor = results.paginatorInfo.endCursor
      } catch (err) {
        handleError(this, err)
      }
      this.loading.loadMore = false
    },

    async fetchData() {
      const fields = this.recordInfo.paginationOptions.headerOptions
        .map((headerInfo) => headerInfo.field)
        .concat(this.recordInfo.requiredFields ?? [])

      // changed: exclude 'ranking' field from query in isRankMode
      const { query, serializeMap } = processQuery(
        this,
        this.recordInfo,
        this.isRankMode
          ? fields.filter((field) => field !== 'relevantEraRanking')
          : this.isRelevantRecordMode
          ? fields.filter((field) => field !== 'daysRecordStood')
          : fields
      )

      const results = await getPaginatorData(
        this,
        'get' + this.capitalizedType + 'Paginator',
        query,
        this.generatePaginatorArgs(true)
      )

      // remove any undefined serializeMap elements
      serializeMap.forEach((val, key) => {
        if (val === undefined) serializeMap.delete(key)
      })

      // apply serialization to results
      results.edges.forEach((ele) => {
        serializeMap.forEach((serialzeFn, field) => {
          serializeNestedProperty(ele.node, field, serialzeFn)
        })
      })

      return results
    },
  },
}
</script>

<style scoped>
.v-data-table
  > .v-data-table__wrapper
  > table
  > tbody
  > tr.expanded-row-bg:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) {
  background: var(--v-secondary-base);
}

.selected-bg {
  background-color: var(--v-primary-base);
}
</style>
