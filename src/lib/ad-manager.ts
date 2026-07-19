import { AdMob } from "@capacitor-community/admob";

const REWARDED_ID = "ca-app-pub-4087959609582329/3668765387";
const INTERSTITIAL_ID = "ca-app-pub-4087959609582329/7901174349";

class AdManagerClass {
  private initialized = false;
  private rewardReady = false;
  private interstitialReady = false;
  private showingAd = false;

  async initialize() {
    if (this.initialized) return;

    try {
      await AdMob.initialize();
      this.initialized = true;

      await Promise.all([
        this.prepareReward(),
        this.prepareInterstitial(),
      ]);

      console.log("✅ AdManager Initialized");
    } catch (e) {
      console.log("AdManager init failed", e);
    }
  }

  async prepareReward() {
    try {
      await AdMob.prepareRewardVideoAd({
        adId: REWARDED_ID,
        isTesting: false,
      });

      this.rewardReady = true;
    } catch (e) {
      this.rewardReady = false;
    }
  }

  async prepareInterstitial() {
    try {
      await AdMob.prepareInterstitial({
        adId: INTERSTITIAL_ID,
        isTesting: false,
      });

      this.interstitialReady = true;
    } catch (e) {
      this.interstitialReady = false;
    }
  }

  async showReward() {
    if (this.showingAd) return false;

    this.showingAd = true;

    try {
      if (!this.rewardReady) {
        await this.prepareReward();
      }

      await AdMob.showRewardVideoAd();

      this.rewardReady = false;
      this.prepareReward();

      return true;
    } catch (e) {
      console.log("Reward failed", e);
      return false;
    } finally {
      this.showingAd = false;
    }
  }

  async showInterstitial() {
    if (this.showingAd) return false;

    this.showingAd = true;

    try {
      if (!this.interstitialReady) {
        await this.prepareInterstitial();
      }

      await AdMob.showInterstitial();

      this.interstitialReady = false;
      this.prepareInterstitial();

      return true;
    } catch (e) {
      console.log("Interstitial failed", e);
      return false;
    } finally {
      this.showingAd = false;
    }
  }
}

export const AdManager = new AdManagerClass();