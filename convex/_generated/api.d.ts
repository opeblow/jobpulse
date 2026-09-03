/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addJob from "../addJob.js";
import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as coach from "../coach.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as sendEmail from "../sendEmail.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addJob: typeof addJob;
  ai: typeof ai;
  analytics: typeof analytics;
  coach: typeof coach;
  emails: typeof emails;
  http: typeof http;
  jobs: typeof jobs;
  sendEmail: typeof sendEmail;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
