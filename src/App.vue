<template>
  <PDFReader msg="Vite + Vue" />
</template>

<script setup>
import PDFReader from './components/PDFReader.vue'
import {onMounted} from "vue";
import resources from '@/data/cachedResources.json';
import { register } from 'register-service-worker';

onMounted(() => {
  // const acc = [];
  // resources.map((item) => acc.includes(item.split('.').pop()) ? null : acc.push(item.split('.').pop()));
  // console.log(acc);

  if ('serviceWorker' in navigator) {

      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
          .then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);

            navigator.serviceWorker.controller.postMessage({
              type: 'MESSAGE_IDENTIFIER',
            });

            const messageChannel = new MessageChannel();

// First we initialize the channel by sending
// the port to the Service Worker (this also
// transfers the ownership of the port)
            navigator.serviceWorker.controller.postMessage({
              type: 'INIT_PORT',
            }, [messageChannel.port2]);

// Listen to the response
            messageChannel.port1.onmessage = (event) => {
              // Print the result
              console.log(event.data.payload);
            };

// Then we send our first message
            navigator.serviceWorker.controller.postMessage({
              type: 'INCREASE_COUNT',
            });

            // Setup a listener to receive messages from the service worker
            function listenForMessage(serviceWorker) {
              if (serviceWorker) {
                serviceWorker.addEventListener('message', event => {
                  console.log('Received a message from service worker: ', event.data);
                });

                // Send a message to the service worker
                serviceWorker.postMessage('Are you there, SW?');
              }
            }

            // Set up listeners on all possible states of the service worker
            listenForMessage(registration.installing);
            listenForMessage(registration.waiting);
            listenForMessage(registration.active);
          }, err => {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
          });

  }

  // if (import.meta.env.MODE === 'production') {

    // register(`${import.meta.env.BASE_URL}sw.js`, {
    //   ready() {
    //     console.log('App is being served from cache by a service worker')
    //   },
    //   registered() {
    //     console.log('Service worker has been registered')
    //   },
    //   cached() {
    //     console.log('Content has been cached for offline use')
    //   },
    //   updatefound() {
    //     console.log('New content is downloading')
    //   },
    //   updated() {
    //     console.log('New content is available, please refresh')
    //   },
    //   offline() {
    //     console.log('No internet conection found. App is running in offline mode.')
    //   },
    //   error(error) {
    //     console.error('Error during service worker registration:', error)
    //   },
    // })

  // }

});
</script>