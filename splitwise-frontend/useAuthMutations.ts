"use client";

import { useMutation } from "@tanstack/react-query";
import { handleAuthMutation } from "@repo/lib/authMutation";
import { apiFetch } from "@repo/lib/apiFetch";
import { toast } from "sonner";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Registration payload types
interface BaseRegistrationData {
	phone: string;
	fullName: string;
	city: string;
}

interface BuyerRegistrationData extends BaseRegistrationData {
	documentType: "AADHAAR";
	aadhaarNumber: string;
	aadhaarCardImage: string;
}

interface SellerRegistrationData extends BaseRegistrationData {
	documentType: "PAN_CARD";
	panNumber: string;
	panCardImage: string;
	aadhaarNumber: string;
	aadhaarCardImage: string;
}

interface DriverRegistrationData extends BaseRegistrationData {
	documentType: "DRIVING_LICENSE";
	dateOfBirth: string;
	licenseNumber: string;
	licenseCategory: string;
	licenseFrontImage: string;
}

export type RegistrationData =
	| BuyerRegistrationData
	| SellerRegistrationData
	| DriverRegistrationData;

// ============================================================================
// AUTHENTICATION HOOKS
// ============================================================================

export function useSignInPhone() {
  return useMutation({
    mutationFn: async (data: { phone: string; otp: string }) => {
      const response = await handleAuthMutation("auth/phone/signin", data);

      if (response.statusCode === 201) {
        // Return the response as-is for the page component to handle
        return response;
      } else {
        throw new Error("Unexpected response status");
      }
    },

    onError: (error: any) => {
      // Only show error toast here, let page component handle success
      console.error("Sign in error:", error);
    },
  });
}

// ============================================================================
// REGISTRATION HOOKS
// ============================================================================

export function useSendOtp() {
	return useMutation({
		mutationFn: async (body: { phone: string; intent: "register" | "signin" }) => {
			return await apiFetch("auth/phone/send-otp", {
				method: "POST",
				body: JSON.stringify(body),
			});
		},

		onSuccess: (response) => {
			if (response.statusCode === 200) {
				toast.success("OTP sent successfully!");
			} else {
				toast.warning(response.message || "Unexpected response status");
			}
		},

		onError: (error: any) => {
			// Handle API error responses
			if (error.status === 409) {
				toast.error(error.message || "User already registered. Please use signin instead.");
			} else if (error.status === 404) {
				toast.error(error.message || "User not found. Please register first.");
			} else if (error.status === 400) {
				toast.error(error.message || "Invalid phone number or request");
			} else if (error.status === 429) {
				toast.error("Too many requests. Please wait before trying again.");
			} else {
				toast.error(error.message || "Failed to send OTP. Please try again.");
			}
		},

		mutationKey: ["send-otp"],
	});
}

export function useVerifyOtpOnly() {
	return useMutation({
		mutationFn: async (data: { phone: string; otp: string }) => {
			return await apiFetch("auth/phone/verify-otp-only", {
				method: "POST",
				body: JSON.stringify(data),
			});
		},

		onSuccess: (response) => {
			if (response.statusCode === 200) {
				toast.success("OTP Verified Successfully!");
			} else {
				toast.warning("Unexpected response status");
			}
		},

		onError: (error: any) => {
			toast.error(error.message || "OTP Verification Failed");
		},

		mutationKey: ["verify-otp-only"],
	});
}

export function useRegisterUser() {
	return useMutation({
		mutationFn: async (registrationData: RegistrationData) => {
			return await apiFetch("auth/phone/register", {
				method: "POST",
				body: JSON.stringify(registrationData),
				headers: {
					"Content-Type": "application/json",
				},
			});
		},

		onSuccess: (response) => {
			if (response.statusCode === 201) {
				toast.success("Registration completed successfully!");
			} else {
				toast.warning("Unexpected response status");
			}
		},

		onError: (error: any) => {
			toast.error(error.message || "Registration Failed");
		},

		mutationKey: ["register-user"],
	});
}
