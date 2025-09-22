import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {firstValueFrom, map} from 'rxjs';
import { toJsonString } from '@bufbuild/protobuf'; // <--

import type { KeyClient, RoutingClient } from 'ts-action-intention';
import type { SecureEnvelopeListPb, SecureEnvelopePb, SecureEnvelope } from '@illmade-knight/action-intention-protos';
import { URN, secureEnvelopeToProto, SecureEnvelopePbSchema } from '@illmade-knight/action-intention-protos';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class AngularKeyClient implements KeyClient {
  constructor(private http: HttpClient) {}

  getKey(userId: URN): Promise<Uint8Array> {
    const url = `${environment.keyServiceUrl}/keys/${userId.toString()}`;
    return firstValueFrom(
      this.http.get(url, { responseType: 'arraybuffer' })
    ).then(buffer => new Uint8Array(buffer));
  }

  storeKey(userId: URN, key: Uint8Array): Promise<void> {
    const url = `${environment.keyServiceUrl}/keys/${userId.toString()}`;
    const keyBuffer = key.buffer;

    console.log(
      `%c[Checkpoint 1: UPLOAD] Key to be sent`,
      'color: blue; font-weight: bold;',
      {
        byteLength: keyBuffer.byteLength, // This should be 294
        keyAsUint8Array: keyBuffer,
      }
    );

    return firstValueFrom(
      this.http.post<void>(url, keyBuffer, {
        headers: { 'Content-Type': 'application/octet-stream' },
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class AngularRoutingClient implements RoutingClient {
  constructor(private http: HttpClient) {}

  send(envelope: SecureEnvelope): Promise<void> {
    const spb = secureEnvelopeToProto(envelope);
    const url = `${environment.routingServiceUrl}/send`;

    // THIS IS NOW CORRECT:
    // Use the runtime schema object 'SecureEnvelopePbSchema'
    // instead of the compile-time type 'SecureEnvelopePb'.
    const jsonPayload = toJsonString(SecureEnvelopePbSchema, spb);

    return firstValueFrom(
      this.http.post<void>(url, jsonPayload, {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  receive(userId: URN): Promise<SecureEnvelope[]> {
    const url = `${environment.routingServiceUrl}/messages`;
    // The authInterceptor will handle the JWT header.
    return firstValueFrom(
      // 1. The HTTP call still expects the raw Protobuf type from the server.
      this.http.get<SecureEnvelopeListPb>(url).pipe(
        // 2. Use the RxJS 'map' operator to transform the incoming array.
        map(protoEnvelopes =>
          // 3. Use the standard JS '.map()' array method to convert each item.
          protoEnvelopes.envelopes.map(pb => {
            const se = secureEnvelopeFromProto(pb)
            console.log("re", se)
            return se
          }) //
        )
      )
    );
  }
}

// should be able to use the import from @illmade-knight/action-intention-protos but for some reason wasn't working
// use it when it's sorted out
function secureEnvelopeFromProto(protoEnvelope: SecureEnvelopePb): SecureEnvelope {
  return {
    senderId: URN.parse(protoEnvelope.senderId),
    recipientId: URN.parse(protoEnvelope.recipientId),
    messageId: protoEnvelope.messageId,
    // Convert Base64 strings to Uint8Array here
    encryptedSymmetricKey: base64ToBytes(protoEnvelope.encryptedSymmetricKey as unknown as string),
    encryptedData: base64ToBytes(protoEnvelope.encryptedData as unknown as string),
    signature: protoEnvelope.signature, // Assuming signature is already a byte array
  };
}

function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
