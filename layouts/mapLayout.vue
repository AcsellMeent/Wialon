<template>
  <v-app dark>
    <v-app-bar :clipped-left="clipped" :clipped-right="clipped" fixed app height="60">
      <v-btn @click="$store.commit('switchAppBarVisible')" icon>
        <v-icon>
          mdi-{{ `chevron-${$store.state.appBarVisible ? 'left' : 'right'}` }}
        </v-icon>
      </v-btn>
      <v-toolbar-title v-text="title" />
      <div class="ml-13">
        <v-bottom-navigation v-model="value" shift class="elevation-0">
          <v-btn>
            <span>
              Objects
            </span>
            <v-icon>
              mdi-truck
            </v-icon>
          </v-btn>
          <v-btn>
            <span>
              List
            </span>
            <v-icon>
              mdi-list-box
            </v-icon>
          </v-btn>
        </v-bottom-navigation>
      </div>
    </v-app-bar>
    <v-main>
      <v-container class="pa-0 ma-0">
        <Nuxt />
      </v-container>
    </v-main>
  </v-app>
</template>
  
<script>
import { mapMutations } from 'vuex'

export default {
  name: 'mapLayout',
  data() {
    return {
      miniVariant: false,
      value: 0,
      clipped: true,
      title: 'CDO-LOGISTIC',
      buttons: [
        {
          title: 'Truck',
          icon: 'mdi-truck',
          to: '/map'
        },
        {
          title: 'List',
          icon: 'mdi-list-box',
          to: '/'
        }
      ]
    }
  },
}
</script>
  