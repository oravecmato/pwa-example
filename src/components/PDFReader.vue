<template>
  <div id="pspdfkit" ref="el" style="width: 100vw; height: 100vh;"></div>
</template>

<script setup>
import {ref, onMounted, toRaw} from 'vue'
import PSPDFKit from 'pspdfkit'
import { useStorage } from '@vueuse/core';

const el = ref()
const instance = ref(null);
const instantJson = useStorage('instant-json', {});

const isInstantJsonEmpty = (instantJson) => !(('annotations' in instantJson) || ('bookmarks' in instantJson));

const loadPSPDFKit = async (file, instantJSON) => {
  console.log(instantJSON);
  PSPDFKit.unload('#pspdfkit');

  return PSPDFKit.load({
    document: file,
    container: '#pspdfkit',
    baseUrl: 'http://localhost:5173/',
    initialViewState: new PSPDFKit.ViewState({
      sidebarMode: PSPDFKit.SidebarMode.THUMBNAILS,
    }),
    instant: true,
    ...(() => (!isInstantJsonEmpty(instantJSON) ? { instantJSON: toRaw(instantJSON) } : {}))(),
    toolbarItems: [
      'sidebar-thumbnails',
      'sidebar-document-outline',
      'sidebar-annotations',
      'sidebar-bookmarks',
      'pager',
      'pan',
      'zoom-out',
      'zoom-in',
      'zoom-mode',
      'spacer',
      'text-highlighter',
      'highlighter',
      'note',
      'search',
    ].map((type) => ({ type })),
}).then((instance) => {
    instance.addEventListener('annotations.willSave', save);
    instance.addEventListener('bookmarks.change', save);
    return instance;
  });
};

const save = async () => {
  if (instance.value) {
    const instantJsonTmp = await instance.value.exportInstantJSON();
    instantJson.value = !isInstantJsonEmpty(instantJsonTmp) ? instantJsonTmp : null;
  }
};

onMounted(async () => {
  instance.value = await loadPSPDFKit('/sample.pdf', instantJson.value);
})
</script>
