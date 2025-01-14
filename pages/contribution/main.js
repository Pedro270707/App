/* global axios */
const contributionModal = () => import('./contributionModal.js')

export default {
  components: {
    contributionModal
  },
  name: 'contribution-page',
  template: `
  <v-container>
    <contribution-modal ref="mod" :contributors='contributors' :onSubmit='onModalSubmit'></contribution-modal>
    <div class="text-h4 py-4">
      {{ $root.lang().database.titles.contributions }}
    </div>
    <v-row>
      <v-col>
        <div class="my-2 text-h5">{{ $root.lang().database.subtitles.resolution }}</div>
        <v-btn
          v-for="(resobj) in form.resolutions"
          :key="resobj.key"
          class="my-2 mr-1"
        ><v-checkbox
          v-model="resobj.selected"
          :disabled="resobj.key != all_res && (form.resolutions[0] !== undefined && form.resolutions[0].selected == true)"
          :label="resobj.key"
          :id="resobj.key"
        ></v-checkbox>
        </v-btn>
      </v-col>
      <v-col>
        <div class="my-2 text-h5">{{ $root.lang().global.btn.add }}</div>
        <v-btn class="mt-4 mb-2" block @click='newSubmit=true; $refs.mod.open(undefined, false)'>{{ $root.lang().database.subtitles.add_manually }}</v-btn>
      </v-col>
    </v-row>
    <div class="my-2 text-h5">{{ $root.lang().database.subtitles.contributor }}</div>
    <v-autocomplete
      v-model="contributors_selected"
      :items="contributors"
      :loading="contributors.length == 0"
      item-text="username"
      item-value="id"
      :label="$root.lang().database.labels.one_contributor"
      multiple
      chips
    >
      <!-- SELECTED THINGY -->
      <template v-slot:selection="data">
        <v-chip
          :key="data.item.id"
          v-bind="data.attrs"
          :input-value="data.selected"
          :disabled="data.disabled"
          close
          @click:close="remove(data.item.id)"
        >
          <v-avatar
            :class="{ accent: data.item.uuid == undefined, 'text--white': true }"
            left
          >
            <template v-if="data.item.uuid != undefined">
              <v-img eager
                :src="'https://visage.surgeplay.com/face/24/' + (data.item.uuid || 'X-Alex')"
                :alt="data.item.username.slice(0, 1).toUpperCase()"
              />
            </template>
            <template v-else>
              {{ (data.item.username || ('' + data.item.id)).slice(0, 1) }}
            </template>
          </v-avatar>
          {{ data.item.username || data.item.id }}
        </v-chip>
      </template>

      <!-- LIST ITEM PART -->
      <template v-slot:item="data">
        <template v-if="data.item && data.item.contructor && data.item.constructor.name === 'String'">
          <v-list-item-content v-text="data.item"></v-list-item-content>
        </template>
        <template v-else>
          <v-list-item-content>
            <v-list-item-title v-text="data.item.username || data.item.id"></v-list-item-title>
            <v-list-item-subtitle v-html="data.item.occurences + ' contribution' + (data.item.occurences > 1 ? 's' : '')"></v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-avatar :style="{ 'background': data.item.uuid ? 'transparent' : '#4e4e4e' }">
            <template v-if="data.item.uuid">
              <v-img eager :src="'https://visage.surgeplay.com/head/48/' + (data.item.uuid || 'X-Alex')" />
            </template>
            <div v-else>{{ (data.item.username || ('' + data.item.id)).slice(0, 1) }}</div>
          </v-list-item-avatar>
        </template>
      </template>
    </v-autocomplete>
    <v-btn block @click="startSearch()" :disabled="searchDisabled">{{ $root.lang().database.labels.search_contributions }}<v-icon right dark>mdi-magnify</v-icon></v-btn>

    <v-list rounded v-if="search.search_results.length" two-line color="rgba(255, 255, 255, 0.08)" class="mt-4">
      <v-row><v-col :cols="12/listColumns" xs="1"
          v-for="(contrib_arr, index) in splittedResults"
          :key="index"
        >
        <v-list-item
          v-for="contrib in contrib_arr"
          :key="contrib.id"
        >
          <v-list-item-avatar tile
            :style="{
              'height': '64px',
              'width': '64px',
              'min-width': '64px'
            }"
          >
            <v-img class="texture-img" v-if="contrib.url" :src="contrib.url" />
            <v-img class="texture-img" v-else :src="'https://compliancepack.net/image/icon/compliance_' + contrib.res.slice(1) + 'x.png'" />
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="(new Date(contrib.date)).toDateString() + ' '+ (!!contrib.textureName ? ' - ' + contrib.textureName : '')"></v-list-item-title>
            <v-list-item-subtitle v-text="(contrib.contributors||[]).map(id => contributors.filter(c => c.id == id)[0].username || '').join(', ')"></v-list-item-subtitle>

            <div><v-chip label x-small class="mr-1">{{ contrib.res }}</v-chip><v-chip label x-small class="mr-1">#{{contrib.textureID }}</v-chip></div>
          </v-list-item-content>

          <v-list-item-action>
            <v-btn icon @click="editContribution(contrib)">
              <v-icon color="white lighten-1">mdi-pencil</v-icon>
            </v-btn>
          </v-list-item-action>
          <v-list-item-action>
            <v-btn icon @click="deleteContribution(contrib.id)">
              <v-icon color="red lighten-1">mdi-delete</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-col></v-row>
    </v-list>
    <div v-else><br><p><i>{{ $root.lang().global.no_results }}</i></p></div>
  </v-container>`,
  data () {
    return {
      maxheight: 170,
      form: {
        resolutions: [] // [{key: 'all', selected: true }]
      },
      all_res: 'all',
      resolutions: {},
      contributors: [],
      contributors_selected: [],
      search: {
        searching: false,
        search_results: []
      },
      newSubmit: false
    }
  },
  computed: {
    searchDisabled: function () {
      const resSelected = this.form.resolutions.reduce((a, c) => a || c.selected, false) === false
      const result = this.search.searching || resSelected || this.contributors_selected.length === 0
      return result
    },
    listColumns: function () {
      let columns = 1

      if (this.$vuetify.breakpoint.mdAndUp && this.contributors.length >= 6) {
        columns = 2
        if (this.$vuetify.breakpoint.lgAndUp && this.contributors.length >= 21) {
          columns = 3
        }
      }

      return columns
    },
    splittedResults: function () {
      const res = []
      for (let col = 0; col < this.listColumns; ++col) {
        res.push([])
      }

      let arrayIndex = 0
      this.search.search_results.forEach(contrib => {
        res[arrayIndex].push(contrib)
        arrayIndex = (arrayIndex + 1) % this.listColumns
      })

      return res
    },
    onModalSubmit: function() {
      return this.newSubmit ? this.onNewSubmit : this.onChangeSubmit
    }
  },
  methods: {
    getRes: function () {
      axios.get('/contributions/res')
        .then(res => {
          res.data.forEach(r => {
            this.addRes(r)
          })
        })
    },
    getAuthors: function () {
      axios.get('/contributions/authors/')
        .then(res => {
          this.contributors = res.data.map(e => {
            return Object.merge({
              username: '',
              uuid: '',
              type: [],
              media: []
            }, e)
          })
        })
        .catch(err => {
          console.trace(err)
        })
    },
    remove (id) {
      const index = this.contributors_selected.indexOf(id)
      if (index >= 0) this.contributors_selected.splice(index, 1)
    },
    addRes (name, value = false) {
      this.form.resolutions.push({
        key: name,
        selected: value
      })
    },
    startSearch: function () {
      this.search.searching = true
      axios({
        method: 'get',
        url: '/contributions/get/',
        params: {
          resolutions: this.form.resolutions.filter(r => r.selected).map(r => r.key),
          authors: this.contributors_selected
        }
      })
        .then(res => {
          res.data.sort((a, b) => b.date - a.date)
          this.search.search_results = res.data
        })
        .catch(err => { this.$root.showSnackBar(err, 'error') })
        .finally(() => {
          this.search.searching = false
        })
    },
    onNewSubmit: function(data) {
      axios.post('/contribution/', this.$root.addToken(data))
        .then(() => {
          this.$root.showSnackBar(this.$root.lang().global.ends_success, 'success')
        })
        .catch(err => { this.$root.showSnackBar(err, 'error') })
    },
    editContribution: function(contrib) {
      this.newSubmit = false
      this.$refs.mod.open(contrib, false)
    },
    onChangeSubmit: function(data) {
      console.log(data)
      axios.put('/contribution/' + data.id, this.$root.addToken(data))
        .then(() => {
          this.$refs.mod.close()
          this.$root.showSnackBar(this.$root.lang().global.ends_success, 'success')
        })
        .catch(err => { this.$root.showSnackBar(err, 'error') })
    },
    deleteContribution: function(id) {
      axios.delete('/contribution/' + id, { data: this.$root.addToken({}) })
        .then(() => {
          this.$root.showSnackBar(this.$root.lang().global.ends_success, 'success')
        })
        .catch(err => { this.$root.showSnackBar(err, 'error') })
    }
  },
  created: function () {
    this.addRes(this.all_res, true)
  },
  mounted: function () {
    this.getRes()
    this.getAuthors()

    // use the logged user as default selected contributor
    this.contributors_selected = [this.$root.user.id]
  },
  watch: {
    contributors: {
      handler: function(contributors) {
        // FIX BUG WHERE USERS WITH NO CONTRIBUTIONS GET INCLUDED IN SEARCH
        const contributors_id = contributors.map(c => c.id)
        this.contributors_selected = this.contributors_selected.filter(c => contributors_id.includes(c))
      },
      deep: true
    }
  }
}
