<template>
  <v-app>
    <v-main>
      <v-container>
        <!-- ヘッダーエリア：タイトル ＆ 情報提供ボタン -->
        <div class="d-flex align-center justify-space-between mb-4">
          <h1 class="text-h4 font-weight-bold">イベント一覧</h1>

          <!-- 情報提供ボタン -->
          <v-btn
            :href="FORM_URL"
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            elevation="2"
            rounded
          >
            <v-icon left>mdi-pencil-plus</v-icon>
            情報提供はこちら
          </v-btn>
        </div>

        <!-- ローディング表示 -->
        <div v-if="loading" class="text-center my-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">データを読み込んでいます...</p>
        </div>

        <!-- カード一覧表示 -->
        <v-row v-else>
          <v-col
            v-for="event in events"
            :key="event.id"
            cols="12"
            md="6"
          >
            <EventCard :event="event" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import EventCard from './components/EventCard.vue';

export default {
  name: 'App',
  components: {
    EventCard
  },
  data() {
    return {
      loading: true,
      events: [],
      // ↓ ここにGoogleフォームの短縮URL（https://forms.gle/...）を貼り付けます
      FORM_URL: 'https://forms.gle/hPycTs6KY5iZ64mZ6'
    };
  },
  mounted() {
    this.fetchEvents();
  },
  methods: {
    async fetchEvents() {
      // ↓ ご自身のGAS URLに書き換えてください
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbyarH7Ur__WCEiQmqZROgCp1_I2G2hnRkXbRn7ckXQMr5DNutkQN1g7CLBh4Jj2q4iZ/exec';

      try {
        const response = await fetch(GAS_URL);
        const rawData = await response.json();

        const grouped = {};
        rawData.forEach(item => {
          if (!item.id && !item.eventName) return;

          const key = item.id || item.eventName;

          if (!grouped[key]) {
            grouped[key] = {
              id: key,
              eventName: item.eventName || 'イベント名未設定',
              groups: []
            };
          }

          if (item.performers || item.time || item.stages || item.perks || item.url) {
            grouped[key].groups.push({
              performers: item.performers || item.performer || '出演者未設定',
              stages: item.stages || item.stage || 'なし',
              perks: item.perks || item.perk || 'なし',
              time: item.time || '',
              url: item.url || ''
            });
          }
        });

        this.events = Object.values(grouped);

      } catch (error) {
        console.error('データの取得に失敗しました:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
