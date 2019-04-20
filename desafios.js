import axios from 'axios';

import {
  OBTER_DESAFIOS,
  OBTER_DESAFIOS_SUCESSO,
  OBTER_DESAFIOS_FALHA,
  FAVORITAR_DESAFIO,
  OBTER_DESAFIOS_FAV,
  OBTER_DESAFIOS_FAV_SUC,
  OBTER_DESAFIOS_FAV_FALHA,
  PARTICIPAR_DESAFIO_FALHA,
  PARTICIPAR_DESAFIO_SUC,
  PARTICIPAR_DESAFIO,
  FAVORITAR_DESAFIO_FALHA,
  DESFAVORITAR_DESAFIO_FAV,
  DESFAVORITAR_DESAFIO_FAV_FALHA,
  DESFAVORITAR_DESAFIO_FAV_SUC,
  PARTICIPAR_DESAFIO_FAV,
  PARTICIPAR_DESAFIO_FAV_FALHA,
  PARTICIPAR_DESAFIO_FAV_SUC,
  ATUALIZAR_FAV_POR_DESAFIOS,
  OBTER_DESAFIO_SUCESSO,
  OBTER_DESAFIO_FALHA,
  OBTER_DESAFIO,
  ATUALIZAR_PARTICIPAR_POR_DESAFIOS,
  FAVORITAR_DESAFIO_SUC,
  ENVIANDO_PROGRESSO,
} from '../types';
// import { UserInterface, DesafioFavoritoInterface } from '../interface';
import {
  logError, upload, logInfo
} from '../utils';
import NavigationService from '../navigation/NavigationService';
import { ApiBase } from '../constants/Api';

export const obterDesafios = (rank, categoria, userInfo) => async (dispatch) => {
  dispatch({ type: OBTER_DESAFIOS });

  axios.get(`${ApiBase}/desafios/`, { params: { rank, categoria, userId: userInfo.id } })
    .then((response) => {
      // console.log('obterDesafios ', response.data);
      dispatch({ type: OBTER_DESAFIOS_SUCESSO, rank, payload: response.data.results });
    })
    .catch((error) => {
      logError('obterDesafioS ', error);
      dispatch({ type: OBTER_DESAFIOS_FALHA, payload: error });
    });
};


export const obterDesafiosFavoritos = userInfo => async (dispatch) => {
  dispatch({ type: OBTER_DESAFIOS_FAV });

  axios.get(`${ApiBase}/usuarios/${userInfo.id}/favoritos`)
    .then((response) => {
      dispatch({ type: OBTER_DESAFIOS_FAV_SUC, payload: response.data.results });
    })
    .catch((error) => {
      logError('obterDesafiosFavoritos ', error);
      dispatch({ type: OBTER_DESAFIOS_FAV_FALHA, payload: error });
    });
};

export const obterDesafio = (idDesafio, userInfo) => async (dispatch) => {
  dispatch({ type: OBTER_DESAFIO });

  axios.get(`${ApiBase}/desafios/${idDesafio}`, { params: { userId: userInfo.id } })
    .then(async (response) => {
      dispatch({ type: OBTER_DESAFIO_SUCESSO, payload: response.data.results });
    })
    .catch((error) => {
      logError('obterDesafio ', error);
      dispatch({ type: OBTER_DESAFIO_FALHA, payload: error });
    });
};

export const favoritar = (params, userInfo) => {
  const [desafio, remover, index] = [params.desafio, params.remover, params.index];

  return (dispatch) => {
    const type = params.reducer === 'desafio' ? FAVORITAR_DESAFIO : DESFAVORITAR_DESAFIO_FAV;
    dispatch({
      type,
      payload: {
        index, remover, tipo: desafio.rank, desafio
      }
    });

    const data = {
      desafioId: desafio.id,
      userId: userInfo.id,
    };

    let promise;

    if (remover) {
      promise = axios.delete(`${ApiBase}/desafios/${desafio.id}/favoritar`, { params: data });
    } else {
      promise = axios.post(`${ApiBase}/desafios/${desafio.id}/favoritar`, data);
    }

    promise
      .then(() => {
        favoritarDesafioSuc(remover, desafio, params.reducer);
      })
      .catch((error) => {
        favoritarDesafioFalha(error, desafio, index, remover, params.reducer);
      });
  };
};

const favoritarDesafioSuc = async (remover, desafio, reducer) => (dispatch) => {
  // Caso a origem seja desafio, atualizar o reducer de desafio
  if (reducer === 'desafio') {
    dispatch({ type: ATUALIZAR_FAV_POR_DESAFIOS, payload: { desafio, remover } });
    dispatch({ type: FAVORITAR_DESAFIO_SUC });

    // Se for favorito, atulizar o de favorito
  } else {
    dispatch({ type: DESFAVORITAR_DESAFIO_FAV_SUC });
  }
};

const favoritarDesafioFalha = async (error, desafio, index, remover, reducer) => (dispatch) => {
  logError('favoritar ', error);

  const type = reducer === 'desafio' ? FAVORITAR_DESAFIO_FALHA : DESFAVORITAR_DESAFIO_FAV_FALHA;
  dispatch({ type, payload: { index, remover: !remover, tipo: desafio.rank } });
};

// Salvar em desafio_participante o uid do desafio com info basica do usuário
export const participar = ({
  desafio, remover, index, reducer, file
}, userInfo) => async (dispatch) => {
  const type = reducer === 'desafio' ? PARTICIPAR_DESAFIO : PARTICIPAR_DESAFIO_FAV;
  const payload = {
    index, remover, rank: desafio.rank, desafio
  };
  dispatch({ type, payload });

  let promise;
  const desafioInfo = {
    desafioId: desafio.id,
    userId: userInfo.id,
  };

  if (remover) {
    promise = axios.delete(`${ApiBase}/desafios/${desafio.id}/participar`, { params: desafioInfo });
  } else {
    const {
      url, challengeDuration, error
    } = await upload(file, userInfo, ENVIANDO_PROGRESSO);

    if (error) {
      return participarDesafioFalha(error, payload, reducer);
    }

    const dados = {
      ...desafioInfo,
      duracao: challengeDuration,
      fileType: file.type,
      fileUrl: url
    };

    promise = axios.post(`${ApiBase}/desafios/${desafio.id}/participar`, dados);
  }

  return promise
    .then(() => {
      dispatch(
        participarDesafioSuc(desafio, reducer)
      );
    })
    .catch((error) => {
      dispatch(
        participarDesafioFalha(error, remover, reducer)
      );
    });
};

const participarDesafioSuc = (desafio, reducer) => (dispatch) => {
  logInfo('participarDesafioSuc2');
  // Caso a origem seja desafio, atualizar o reducer de desafio
  if (reducer === 'desafio') {
    dispatch({ type: ATUALIZAR_PARTICIPAR_POR_DESAFIOS, payload: desafio });
    dispatch({ type: PARTICIPAR_DESAFIO_SUC, desafioId: desafio.id });
  } else {
    // Se for favorito, atulizar o de favorito
    dispatch({ type: PARTICIPAR_DESAFIO_FAV_SUC });
  }

  NavigationService.navigate('Desafios', { rank: desafio.rank });
};

const participarDesafioFalha = (error, payload, reducer) => (dispatch) => {
  logError('participar ', error);

  const type = reducer === 'desafio' ? PARTICIPAR_DESAFIO_FALHA : PARTICIPAR_DESAFIO_FAV_FALHA;
  dispatch({ type, payload });
};
