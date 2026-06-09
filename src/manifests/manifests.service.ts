import { Injectable } from '@nestjs/common';
import * as yaml from 'js-yaml';
import { CreateDeploymentDto } from '../deployments/dto/create-deployment.dto';
import { generateNamespace } from './generators/namespace.generator';
import { generateConfigMap } from './generators/configmap.generator';
import { generateDeployment } from './generators/deployment.generator';
import { generateService } from './generators/service.generator';
import { generateIngress } from './generators/ingress.generator';
import { generateHpa } from './generators/hpa.generator';
import { generateNetworkPolicy } from './generators/network-policy.generator';
import { generateRbac } from './generators/rbac.generator';

export interface GeneratedManifests {
  individual: Record<string, string>;
  combined: string;
}

@Injectable()
export class ManifestsService {
  generate(dto: CreateDeploymentDto): GeneratedManifests {
    const objects: Record<string, object | object[]> = {};

    objects['namespace'] = generateNamespace(dto);
    objects['configmap'] = generateConfigMap(dto);
    objects['deployment'] = generateDeployment(dto);
    objects['service'] = generateService(dto);

    const ingress = generateIngress(dto);
    if (ingress) objects['ingress'] = ingress;

    const hpa = generateHpa(dto);
    if (hpa) objects['hpa'] = hpa;

    const netpol = generateNetworkPolicy(dto);
    if (netpol) objects['network-policy'] = netpol;

    const rbac = generateRbac(dto);
    if (rbac) objects['rbac'] = rbac;

    const individual: Record<string, string> = {};
    const yamlParts: string[] = [];

    for (const [key, value] of Object.entries(objects)) {
      let yamlStr: string;
      if (Array.isArray(value)) {
        yamlStr = value
          .map((v) => yaml.dump(v, { indent: 2, lineWidth: -1 }))
          .join('---\n');
      } else {
        yamlStr = yaml.dump(value, { indent: 2, lineWidth: -1 });
      }
      individual[key] = yamlStr;
      yamlParts.push(yamlStr);
    }

    const combined = yamlParts.join('---\n');

    return { individual, combined };
  }
}
