<template>
    <el-menu
        router
        :default-active="activeIndex"
        class="el-menu-demo"
        mode="horizontal"
        :ellipsis="false"
        @select="handleSelect">
      <el-menu-item index="/home">
        <div style="height: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center;">
          <img
              style="max-height:100%; max-width: 100%; object-fit: contain"
              src="/首页.svg"
              alt="首页"/>
          <span style="margin-left: 5px; font-size: 18px; font-weight: bold; color: #409EFF;">首页</span>
        </div>
      </el-menu-item>
      <div class="flex-grow"/>
      <el-menu-item index="/oneImageInfer">
        <div style="height: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center;">
          <img
              style="max-height:100%; max-width: 100%; object-fit: contain"
              src="/识别.svg"
              alt="识别"/>
          <span style="margin-left: 5px; font-size: 18px; font-weight: bold; color: #409EFF;">提示词定位</span>
        </div>
      </el-menu-item>
      <el-menu-item index="/labelPlatform">
        <div style="height: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center;">
          <img
              style="max-height:100%; max-width: 100%; object-fit: contain"
              src="/平台.svg"
              alt="平台"/>
          <span style="margin-left: 5px; font-size: 18px; font-weight: bold; color: #409EFF;">自动标注平台</span>
        </div>
      </el-menu-item>
    </el-menu>
</template>

<script lang="ts" setup>
import {ref} from 'vue'

const activeIndex = ref('1')
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<style scoped>
.flex-grow {
  flex-grow: 1;
}
</style>
