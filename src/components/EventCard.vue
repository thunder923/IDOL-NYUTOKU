<template>
  <v-card class="mb-4" outlined elevation="2">
    <!-- イベント名（大見出し） -->
    <v-card-title class="primary white--text text-h5 font-weight-bold py-3">
      {{ event.eventName }}
    </v-card-title>

    <v-card-text class="pa-3">
      <!-- 出演グループごとのアコーディオン -->
      <v-expansion-panels multiple flat>
        <v-expansion-panel
          v-for="(item, index) in event.groups"
          :key="index"
          class="mb-2 border rounded"
        >
          <!-- グループ名 -->
          <v-expansion-panel-header class="font-weight-bold text-subtitle-1 primary--text pa-3">
            <span>
              <v-icon color="primary" class="mr-2">mdi-account</v-icon>
              {{ item.performer || 'グループ名未設定' }}
            </span>
          </v-expansion-panel-header>

          <!-- クリックして開く中身（ステージ & 入場特典） -->
          <v-expansion-panel-content class="pt-2">
            <!-- ステージ名 -->
            <div class="mb-2 body-1">
              <span class="font-weight-bold secondary--text">
                <v-icon small color="secondary" class="mr-1">mdi-stadium</v-icon>ステージ：
              </span>
              <span>{{ item.stage || 'なし' }}</span>
            </div>

            <!-- 入場特典 -->
            <div class="body-1">
              <span class="font-weight-bold success--text">
                <v-icon small color="success" class="mr-1">mdi-gift</v-icon>入場特典：
              </span>
              <span>{{ item.perk || 'なし' }}</span>
            </div>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'EventCard',
  props: {
    event: {
      type: Object,
      required: true
    }
  }
};
</script>