<template>
  <v-app>
    <v-main>
      <v-container>
        <h1 class="mb-4">イベント一覧</h1>
        
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
      events: []
    };
  },
  mounted() {
    this.fetchEvents();
  },
  methods: {
    // 謎の [ ] や " を綺麗に掃除する関数
    cleanText(val) {
      if (!val) return 'なし';
      let str = typeof val === 'string' ? val : JSON.stringify(val);
      str = str.replace(/[\[\]"]/g, '').trim();
      return str || 'なし';
    },

    // URL文字列のクリーニング用
    cleanUrl(val) {
      if (!val) return '';
      let str = typeof val === 'string' ? val : JSON.stringify(val);
      str = str.replace(/[\[\]"]/g, '').trim();
      return str.startsWith('http') ? str : '';
    },

    async fetchEvents() {
      // ↓ ご自身のGAS URLに書き換えてください
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbyarH7Ur__WCEiQmqZROgCp1_I2G2hnRkXbRn7ckXQMr5DNutkQN1g7CLBh4Jj2q4iZ/exec;
      
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
              eventName: this.cleanText(item.eventName),
              groups: []
            };
          }

          const cleanedPerformer = this.cleanText(item.performer || item.performers);
          const cleanedStage = this.cleanText(item.stage || item.stages);
          const cleanedPerk = this.cleanText(item.perk || item.perks);
          const cleanedXUrl = this.cleanUrl(item.xUrl || item.noticeUrl || item.url);

          if (cleanedPerformer !== 'なし' || cleanedStage !== 'なし' || cleanedPerk !== 'なし') {
            grouped[key].groups.push({
              performer: cleanedPerformer !== 'なし' ? cleanedPerformer : '出演者未設定',
              stage: cleanedStage,
              perk: cleanedPerk,
              xUrl: cleanedXUrl
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