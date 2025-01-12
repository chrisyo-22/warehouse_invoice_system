import { createStore } from 'vuex';
import type { Store } from 'vuex';
import type { Item } from '../types';
import auth from './modules/auth';

interface InvoiceState {
  owner: string;
  recipient: string;
  date: string;
  items: Item[];
}

interface RootState {
  invoice: InvoiceState;
}

export default createStore<RootState>({
  modules: {
    auth
  },
  state: {
    invoice: {
      owner: '',
      recipient: '',
      date: '',
      items: []
    }
  },
  mutations: {
    SET_INVOICE_DATA(state: RootState, payload: InvoiceState) {
      state.invoice = payload;
    }
  },
  actions: {
    saveInvoiceData({ commit }, payload: InvoiceState) {
      commit('SET_INVOICE_DATA', payload);
    }
  },
  getters: {
    getInvoiceData: (state: RootState) => state.invoice
  }
}); 