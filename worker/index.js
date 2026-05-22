/* eslint-disable no-undef */
self.__WB_DISABLE_DEV_LOGS = true;

self.addEventListener("push", (event) => {
  let payload = { title: "Lumen Duo", body: "New update", url: "/" };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    data: { url: payload.url || "/" },
    badge: "/icons/icon.svg",
    icon: "/icons/icon.svg",
    tag: payload.tag || "lumen-duo",
    renotify: true,
  };

  if (self.registration && self.registration.setAppBadge && payload.badge) {
    self.registration.setAppBadge(payload.badge).catch(() => null);
  }

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );

  if (self.registration && self.registration.clearAppBadge) {
    self.registration.clearAppBadge().catch(() => null);
  }
});
