<script lang="ts" setup>
import HeaderMenu from "./components/HeaderMenu.vue";
</script>

<template>
  <div class="common-layout">
    <el-container class="a">
      <el-header class="a-header">
        <HeaderMenu />
      </el-header>
      <el-main class="a-main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.a{
  padding: 0;
  margin: 0;
  width: 99vw;
  height: 98vh;
  display: flex;
  flex-direction: column;
  .a-main{
    flex: 1;
    margin: 0;
    padding: 0
  }
  .a-header{
    margin: 0;
    padding: 0
  }
}
</style>
