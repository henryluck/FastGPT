import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { updateData2Dataset } from '@/service/core/dataset/data/controller';
import { authDatasetData } from '@/service/support/permission/auth/dataset';
import { pushGenerateVectorUsage } from '@/service/support/wallet/usage/push';
import { UpdateDatasetDataProps } from '@/global/core/dataset/api';
import { checkDatasetLimit } from '@fastgpt/service/support/permission/teamLimit';
import { NextAPI } from '@/service/middle/entry';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const { id, q = '', a, indexes = [] } = req.body as UpdateDatasetDataProps;

  // auth data permission
  const {
    collection: {
      datasetId: { vectorModel }
    },
    teamId,
    tmbId
  } = await authDatasetData({
    req,
    authToken: true,
    authApiKey: true,
    dataId: id,
    per: 'w'
  });

  // auth team balance
  await checkDatasetLimit({
    teamId,
    insertLen: 1
  });

  const { tokens } = await updateData2Dataset({
    dataId: id,
    q,
    a,
    indexes,
    model: vectorModel
  });

  pushGenerateVectorUsage({
    teamId,
    tmbId,
    tokens,
    model: vectorModel
  });

  jsonRes(res);
}

export default NextAPI(handler);
