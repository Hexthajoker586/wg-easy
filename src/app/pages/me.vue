<template>
  <main>
    <Panel>
      <PanelHead>
        <PanelHeadTitle :text="$t('pages.me')" />
      </PanelHead>
      <PanelBody class="dark:text-neutral-200">
        <FormElement @submit.prevent="submit">
          <FormGroup>
            <FormHeading>{{ $t('form.sectionGeneral') }}</FormHeading>
            <FormTextField
              id="name"
              v-model="name"
              :label="$t('general.name')"
            />
            <FormNullTextField
              id="email"
              v-model="email"
              :label="$t('user.email')"
            />
            <FormSecondaryActionField type="submit" :label="$t('form.save')" />
          </FormGroup>
        </FormElement>
        <FormElement @submit.prevent="updatePassword">
          <FormGroup>
            <FormHeading>{{ $t('general.password') }}</FormHeading>
            <FormPasswordField
              id="current-password"
              v-model="currentPassword"
              autocomplete="current-password"
              :label="$t('me.currentPassword')"
            />
            <FormPasswordField
              id="new-password"
              v-model="newPassword"
              autocomplete="new-password"
              :label="$t('general.newPassword')"
            />
            <FormPasswordField
              id="confirm-password"
              v-model="confirmPassword"
              autocomplete="new-password"
              :label="$t('general.confirmPassword')"
            />
            <FormSecondaryActionField
              type="submit"
              :label="$t('general.updatePassword')"
            />
          </FormGroup>
        </FormElement>
        <FormElement @submit.prevent>
          <FormGroup>
            <FormHeading>{{ $t('general.2fa') }}</FormHeading>
            <div
              v-if="!authStore.userData?.totpVerified && !twofa"
              class="col-span-2 flex flex-col"
            >
              <FormSecondaryActionField
                :label="$t('me.enable2fa')"
                @click="setup2fa"
              />
            </div>
            <div
              v-if="!authStore.userData?.totpVerified && twofa"
              class="col-span-2"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('me.enable2faDesc') }}
              </p>
              <div class="mt-2 flex flex-col gap-2">
                <img :src="twofa.qrcode" size="128" class="bg-white" />
                <FormTextField
                  id="2fakey"
                  :model-value="twofa.key"
                  :on-update:model-value="() => {}"
                  :label="$t('me.2faKey')"
                  :disabled="true"
                />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ $t('me.2faCodeDesc') }}
                </p>
                <FormTextField
                  id="2facode"
                  v-model="code"
                  :label="$t('general.2faCode')"
                />
                <FormSecondaryActionField
                  :label="$t('me.enable2fa')"
                  @click="enable2fa"
                />
              </div>
            </div>
            <div
              v-if="authStore.userData?.totpVerified"
              class="col-span-2 flex flex-col gap-2"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('me.disable2faDesc') }}
              </p>
              <FormPasswordField
                id="2fapassword"
                v-model="disable2faPassword"
                :label="$t('me.currentPassword')"
                type="password"
                autocomplete="current-password"
              />
              <FormSecondaryActionField
                :label="$t('me.disable2fa')"
                @click="disable2fa"
              />
            </div>
          </FormGroup>
        </FormElement>
        <FormElement @submit.prevent>
          <FormGroup>
            <FormHeading>{{ $t('general.apiKeys') }}</FormHeading>
            <div class="col-span-2 flex flex-col gap-4">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('me.apiKeysDesc') }}
              </p>
              <div v-if="!showCreateApiKey" class="flex flex-col gap-2">
                <FormSecondaryActionField
                  :label="$t('me.createApiKey')"
                  @click="showCreateApiKey = true"
                />
              </div>
              <div v-if="showCreateApiKey" class="flex flex-col gap-2">
                <FormTextField
                  id="api-key-name"
                  v-model="apiKeyName"
                  :label="$t('me.apiKeyName')"
                  :placeholder="$t('me.apiKeyNamePlaceholder')"
                />
                <div class="flex gap-2">
                  <FormSecondaryActionField
                    :label="$t('form.create')"
                    @click="createApiKey"
                  />
                  <FormSecondaryActionField
                    :label="$t('form.cancel')"
                    @click="cancelCreateApiKey"
                  />
                </div>
              </div>
              <div
                v-if="newApiKey"
                class="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20"
              >
                <p
                  class="text-sm font-medium text-yellow-800 dark:text-yellow-200"
                >
                  {{ $t('me.apiKeyCreated') }}
                </p>
                <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {{ $t('me.apiKeyCopyWarning') }}
                </p>
                <div class="mt-2">
                  <FormTextField
                    id="new-api-key"
                    :model-value="newApiKey"
                    :on-update:model-value="() => {}"
                    :label="$t('me.apiKey')"
                    :disabled="true"
                  />
                </div>
              </div>
              <div v-if="apiKeys.length > 0" class="mt-2 flex flex-col gap-2">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ $t('me.existingApiKeys') }}
                </p>
                <div
                  v-for="key in apiKeys"
                  :key="key.id"
                  class="flex items-center justify-between rounded-md border border-gray-300 p-3 dark:border-gray-600"
                >
                  <div class="flex flex-col">
                    <span
                      class="text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      {{ key.name }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ $t('me.createdAt') }}: {{ formatDate(key.createdAt) }}
                    </span>
                    <span
                      v-if="key.lastUsedAt"
                      class="text-xs text-gray-500 dark:text-gray-400"
                    >
                      {{ $t('me.lastUsedAt') }}:
                      {{ formatDate(key.lastUsedAt) }}
                    </span>
                  </div>
                  <FormSecondaryActionField
                    :label="$t('form.revoke')"
                    @click="revokeApiKey(key.id)"
                  />
                </div>
              </div>
              <div
                v-else-if="!showCreateApiKey && !newApiKey"
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                {{ $t('me.noApiKeys') }}
              </div>
            </div>
          </FormGroup>
        </FormElement>
      </PanelBody>
    </Panel>
  </main>
</template>

<script setup lang="ts">
import { encodeQR } from 'qr';

const authStore = useAuthStore();
authStore.update();

const name = ref(authStore.userData?.name);
const email = ref(authStore.userData?.email);

const _submit = useSubmit(
  `/api/me`,
  {
    method: 'post',
  },
  {
    revert: () => {
      return authStore.update();
    },
  }
);

function submit() {
  return _submit({ name: name.value, email: email.value });
}

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const _updatePassword = useSubmit(
  `/api/me/password`,
  {
    method: 'post',
  },
  {
    revert: async () => {
      currentPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
    },
  }
);

function updatePassword() {
  return _updatePassword({
    currentPassword: currentPassword.value,
    newPassword: newPassword.value,
    confirmPassword: confirmPassword.value,
  });
}

const twofa = ref<{ key: string; qrcode: string } | null>(null);

const _setup2fa = useSubmit(
  `/api/me/totp`,
  {
    method: 'post',
  },
  {
    revert: async (success, data) => {
      if (success && data?.type === 'setup') {
        const qrcode = encodeQR(data.uri, 'svg', {
          ecc: 'high',
          scale: 4,
          encoding: 'byte',
        });
        const svg = new Blob([qrcode], { type: 'image/svg+xml' });
        twofa.value = { key: data.key, qrcode: URL.createObjectURL(svg) };
      }
    },
  }
);

async function setup2fa() {
  return _setup2fa({
    type: 'setup',
  });
}

const code = ref<string>('');

const _enable2fa = useSubmit(
  `/api/me/totp`,
  {
    method: 'post',
  },
  {
    revert: async (success, data) => {
      if (success && data?.type === 'created') {
        authStore.update();
        twofa.value = null;
        code.value = '';
      }
    },
  }
);

async function enable2fa() {
  return _enable2fa({
    type: 'create',
    code: code.value,
  });
}

const disable2faPassword = ref('');

const _disable2fa = useSubmit(
  `/api/me/totp`,
  {
    method: 'post',
  },
  {
    revert: async (success, data) => {
      if (success && data?.type === 'deleted') {
        authStore.update();
        disable2faPassword.value = '';
      }
    },
  }
);

async function disable2fa() {
  return _disable2fa({
    type: 'delete',
    currentPassword: disable2faPassword.value,
  });
}

// API Keys
interface ApiKey {
  id: number;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

const apiKeys = ref<ApiKey[]>([]);
const showCreateApiKey = ref(false);
const apiKeyName = ref('');
const newApiKey = ref<string | null>(null);

// Load API keys on mount
onMounted(async () => {
  await loadApiKeys();
});

async function loadApiKeys() {
  try {
    const response = await $fetch('/api/me/api-key', {
      method: 'get',
    });
    apiKeys.value = response as ApiKey[];
  } catch (error) {
    console.error('Failed to load API keys:', error);
  }
}

const _createApiKey = useSubmit(
  `/api/me/api-key`,
  {
    method: 'post',
  },
  {
    revert: async (success, data) => {
      if (success && data) {
        newApiKey.value = data.key;
        apiKeyName.value = '';
        showCreateApiKey.value = false;
        await loadApiKeys();
      }
    },
  }
);

async function createApiKey() {
  if (!apiKeyName.value.trim()) {
    return;
  }
  return _createApiKey({ name: apiKeyName.value });
}

function cancelCreateApiKey() {
  showCreateApiKey.value = false;
  apiKeyName.value = '';
  newApiKey.value = null;
}

const _revokeApiKey = useSubmit(
  (id: number) => `/api/me/api-key/${id}`,
  {
    method: 'delete',
  },
  {
    revert: async (success) => {
      if (success) {
        await loadApiKeys();
      }
    },
  }
);

async function revokeApiKey(id: number) {
  return _revokeApiKey(id);
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}
</script>
