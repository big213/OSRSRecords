<template>
  <div :class="{ 'expanded-table-bg': isChildComponent }">
    <v-data-table
      :headers="headers"
      :items="records"
      class="elevation-1"
      :loading="loading.loadData"
      :options.sync="options"
      loading-text="Loading... Please wait"
      :server-items-length="nextPaginatorInfo.total"
      :footer-props="footerOptions"
      :dense="dense"
      :expanded.sync="expandedItems"
      :single-expand="hasNested"
      @update:options="handleTableOptionsUpdated"
      @update:sort-by="setTableOptionsUpdatedTrigger('sort')"
      @update:sort-desc="setTableOptionsUpdatedTrigger('sort')"
      @update:items-per-page="setTableOptionsUpdatedTrigger('itemsPerPage')"
      @update:page="setTableOptionsUpdatedTrigger('page')"
    >
      <template v-slot:top>
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
            New<span class="hidden-xs-only">&nbsp;{{ recordInfo.name }}</span>
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
            @click="syncFilters() || reset()"
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
                @change="filterChanged = true"
                @keyup.enter="updatePageOptions()"
              ></v-text-field>
            </v-col>
            <v-col
              v-for="(item, i) in visibleFiltersArray"
              :key="i"
              cols="12"
              lg="3"
              class="py-0"
            >
              <GenericFilterInput
                :item="item"
                @handle-submit="updatePageOptions"
                @handle-input="filterChanged = true"
              ></GenericFilterInput>
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
      </template>
      <template v-slot:item="props">
        <tr
          v-if="props.isMobile"
          :key="props.item.id"
          class="v-data-table__mobile-table-row"
          @click="handleRowClick(props.item)"
        >
          <td
            v-for="(headerItem, i) in headers"
            :key="i"
            class="v-data-table__mobile-row"
          >
            <div
              v-if="headerItem.value === null"
              class="text-center"
              style="width: 100%"
            >
              <RecordActionMenu
                :record-info="recordInfo"
                :item="props.item"
                expand-mode="emit"
                bottom
                offset-y
                @handle-action-click="openEditDialog"
                @handle-expand-click="openExpandDialog(props, ...$event)"
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
                <div v-if="headerItem.value === 'rank'">
                  <v-icon
                    v-if="renderRank(props.index) < 4"
                    :class="generatePlaceClass(renderRank(props.index))"
                    >mdi-numeric-{{ renderRank(props.index) }}-box</v-icon
                  >
                  <span v-else>{{ renderRank(props.index) }}</span>
                </div>
                <div v-else>
                  <component
                    :is="headerItem.fieldInfo.component"
                    v-if="headerItem.fieldInfo.component"
                    :item="props.item"
                    :field-path="headerItem.path"
                    @submit="reset({ resetExpanded: false })"
                    @item-updated="reset({ resetExpanded: false })"
                  ></component>
                  <span v-else>
                    {{ getTableRowData(headerItem, props.item) }}
                  </span>
                </div>
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
            v-for="(headerItem, i) in headers"
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
            <span v-else-if="headerItem.value === 'rank'">
              <v-icon
                v-if="renderRank(props.index) < 4"
                :class="generatePlaceClass(renderRank(props.index))"
                >mdi-numeric-{{ renderRank(props.index) }}-box</v-icon
              >
              <span v-else>{{ renderRank(props.index) }}</span>
            </span>
            <span v-else>
              <component
                :is="headerItem.fieldInfo.component"
                v-if="headerItem.fieldInfo.component"
                :item="props.item"
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
    </v-dialog>
  </div>
</template>

<script>
import crudMixin from '~/mixins/crud'
import { executeGiraffeql } from '~/services/giraffeql'
import {
  collapseObject,
  handleError,
  getPaginatorData,
  serializeNestedProperty,
} from '~/services/base'

export default {
  name: 'CrudRecordInterface',

  mixins: [crudMixin],

  data() {
    return {
      rankIndex: null,
      requiredFilters: ['era', 'event', 'participants', 'status'],
    }
  },

  computed: {
    // render the rank header ONLY if sorting by score AND with event, pbClass, setSize, isPublic, and isCurrent filters applied
    isRankMode() {
      let rankMode = false
      if (this.options.sortBy[0] === 'score') {
        const requiredFiltersSet = new Set(this.requiredFilters)
        this.filters.concat(this.lockedFilters).forEach((filterObject) => {
          if (requiredFiltersSet.has(filterObject.field)) {
            requiredFiltersSet.delete(filterObject.field)
          }
        })
        // if all required fields were present, add the header
        if (requiredFiltersSet.size < 1) {
          rankMode = true
        }
      }
      return rankMode
    },

    headers() {
      return (
        this.isRankMode
          ? [
              {
                text: 'Rank',
                sortable: false,
                value: 'rank',
                align: 'right',
                width: '50px',
              },
            ]
          : []
      ).concat(
        this.recordInfo.paginationOptions.headers
          .filter(
            (headerInfo) => !this.hiddenHeaders.includes(headerInfo.field)
          )
          .filter((headerInfo) => {
            // if there is a hideIf function, check it
            if (headerInfo.hideIf && headerInfo.hideIf(this)) return false

            // if isDialog, hide column if isDialog === true
            if (this.isDialog && headerInfo.hideIfDialog) return false

            // allow if no hideUnder
            if (!headerInfo.hideUnder) return true

            // filter out if current viewport is less than the specified hideUnder
            return (
              viewportToPixelsMap[this.$vuetify.breakpoint.name] >=
              viewportToPixelsMap[headerInfo.hideUnder]
            )
          })
          .map((headerInfo) => {
            const fieldInfo = this.recordInfo.fields[headerInfo.field]

            // field unknown, abort
            if (!fieldInfo)
              throw new Error('Unknown field: ' + headerInfo.field)

            const primaryField = fieldInfo.fields
              ? fieldInfo.fields[0]
              : headerInfo.field

            return {
              text: fieldInfo.text ?? headerInfo.field,
              align: headerInfo.align ?? 'left',
              sortable: headerInfo.sortable,
              value: primaryField,
              width: headerInfo.width ?? null,
              fieldInfo,
              // equal to pathPrefix if provided
              // else equal to the field if single-field
              // else equal to null if multiple-field
              path:
                fieldInfo.pathPrefix ??
                (fieldInfo.fields && fieldInfo.fields.length > 1
                  ? null
                  : primaryField),
            }
          })
          .concat({
            text: 'Actions',
            sortable: false,
            value: null,
            width: '50px',
            ...this.recordInfo.paginationOptions.headerActionOptions,
          })
      )
    },
  },

  methods: {
    renderRank(index) {
      // if sorting desc, index must be negative
      const diff = this.pageOptions.sortDesc[0] ? -1 * index : index
      return this.rankIndex ? this.rankIndex + diff : ''
    },

    generatePlaceClass(place) {
      return place === 1
        ? 'first-place-color'
        : place === 2
        ? 'second-place-color'
        : place === 3
        ? 'third-place-color'
        : null
    },

    generateTrClass(props) {
      // if descending OR not sorting by score, return null
      if (
        this.pageOptions.sortDesc[0] ||
        this.pageOptions.sortBy[0] !== 'score'
      )
        return null

      const classArray = []

      classArray.push(
        props.index === 0
          ? 'first-place-bg'
          : props.index === 1
          ? 'second-place-bg'
          : props.index === 2
          ? 'third-place-bg'
          : null
      )

      classArray.push(props.isExpanded ? 'expanded-row-bg' : null)

      return classArray.filter((ele) => ele).join(' ')
    },

    async loadData(showLoader = true, currentReloadGeneration) {
      this.loading.syncData = true
      if (showLoader) this.loading.loadData = true
      try {
        // create a map field -> serializeFn for fast serialization
        const serializeMap = new Map()

        const query = {
          ...collapseObject(
            this.recordInfo.paginationOptions.headers
              .concat(
                (this.recordInfo.requiredFields ?? []).map((field) => ({
                  field,
                }))
              )
              .reduce(
                (total, headerInfo) => {
                  const fieldInfo = this.recordInfo.fields[headerInfo.field]

                  // field unknown, abort
                  if (!fieldInfo)
                    throw new Error('Unknown field: ' + headerInfo.field)

                  const fieldsToAdd = new Set()

                  // add all fields
                  if (fieldInfo.fields) {
                    fieldInfo.fields.forEach((field) => fieldsToAdd.add(field))
                  } else {
                    fieldsToAdd.add(headerInfo.field)
                  }

                  // process fields
                  fieldsToAdd.forEach((field) => {
                    total[field] = true

                    // add a serializer if there is one for the field
                    const currentFieldInfo = this.recordInfo.fields[field]
                    if (currentFieldInfo) {
                      if (currentFieldInfo.serialize) {
                        serializeMap.set(field, currentFieldInfo.serialize)
                      }

                      // if field has args, process them
                      if (currentFieldInfo.args) {
                        total[currentFieldInfo.args.path + '.__args'] =
                          currentFieldInfo.args.getArgs(this)
                      }
                    }
                  })

                  return total
                },
                { id: true, __typename: true } // always add id, typename
              )
          ),
        }

        const args = {
          [this.positivePageDelta ? 'first' : 'last']:
            this.options.itemsPerPage,
          ...(this.options.page > 1 &&
            this.positivePageDelta && {
              after: this.currentPaginatorInfo.endCursor,
            }),
          ...(!this.positivePageDelta && {
            before: this.currentPaginatorInfo.startCursor,
          }),
          sortBy: this.options.sortBy,
          sortDesc: this.options.sortDesc,
          filterBy: [
            this.filters.concat(this.lockedFilters).reduce((total, ele) => {
              // check if there is a parser on the fieldInfo
              const fieldInfo = this.recordInfo.fields[ele.field]

              // field unknown, abort
              if (!fieldInfo) throw new Error('Unknown field: ' + ele.field)

              const primaryField = fieldInfo.fields
                ? fieldInfo.fields[0]
                : ele.field

              if (!total[primaryField]) total[primaryField] = {}

              // parse '__null' to null first
              // also parse '__now()' to current date string
              const value =
                ele.value === '__null'
                  ? null
                  : ele.value === '__now()'
                  ? generateDateLocaleString(new Date().getTime() / 1000)
                  : ele.value

              // apply parseValue function, if any
              total[primaryField][ele.operator] = fieldInfo.parseValue
                ? fieldInfo.parseValue(value)
                : value

              return total
            }, {}),
          ],
          ...(this.search && { search: this.search }),
          ...(this.groupBy && { groupBy: this.groupBy }),
        }

        const results = await getPaginatorData(
          this,
          'get' + this.capitalizedType + 'Paginator',
          query,
          args
        )

        // if reloadGeneration is behind the latest one, end execution early, as the loadData request has been superseded
        if (currentReloadGeneration < this.reloadGeneration) return

        // if any rows returned AND in isRankMode, fetch the rank of the first row
        if (results.edges.length > 0 && this.isRankMode) {
          const rankResults = await executeGiraffeql(this, {
            getSubmission: {
              ranking: true,
              __args: {
                id: results.edges[0].node.id,
              },
            },
          })
          this.rankIndex = rankResults.ranking
        } else {
          this.rankIndex = null
        }

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

        this.records = results.edges.map((ele) => ele.node)

        this.nextPaginatorInfo = results.paginatorInfo
      } catch (err) {
        handleError(this, err)
      }
      this.loading.syncData = false
      if (showLoader) this.loading.loadData = false
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

.first-place-color {
  color: gold;
}

.second-place-color {
  color: silver;
}

.third-place-color {
  color: tan;
}
</style>
