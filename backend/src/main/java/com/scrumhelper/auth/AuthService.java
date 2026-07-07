package com.scrumhelper.auth;

import com.scrumhelper.auth.dto.AuthResponse;
import com.scrumhelper.auth.dto.LoginRequest;
import com.scrumhelper.auth.dto.SignupRequest;
import com.scrumhelper.auth.dto.UpdateProfileRequest;
import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.domain.user.UserRepository;
import com.scrumhelper.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenProvider jwtTokenProvider;

	public AuthService(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			JwtTokenProvider jwtTokenProvider
	) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtTokenProvider = jwtTokenProvider;
	}

	@Transactional
	public AuthResponse signup(SignupRequest request) {
		String email = normalizeEmail(request.email());
		if (userRepository.existsByEmail(email)) {
			throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
		}

		User user = User.create(
				request.name().trim(),
				email,
				passwordEncoder.encode(request.password())
		);
		User savedUser = userRepository.save(user);
		return createAuthResponse(savedUser);
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest request) {
		String email = normalizeEmail(request.email());
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
		}
		return createAuthResponse(user);
	}

	@Transactional(readOnly = true)
	public UserSummaryResponse getMe(Long userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
		return UserSummaryResponse.from(user);
	}

	@Transactional
	public UserSummaryResponse updateProfile(Long userId, UpdateProfileRequest request) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
		user.updateProfile(
				request.name().trim(),
				normalizeOptionalText(request.title()),
				normalizeOptionalText(request.bio()),
				normalizeOptionalText(request.contact())
		);
		return UserSummaryResponse.from(user);
	}

	private AuthResponse createAuthResponse(User user) {
		return new AuthResponse(
				UserSummaryResponse.from(user),
				jwtTokenProvider.createToken(user.getId())
		);
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase();
	}

	private String normalizeOptionalText(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
