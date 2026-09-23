package devAtlas.backend;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import devAtlas.backend.repository.RepositoryRepository;
import devAtlas.backend.models.IndexStatus;
import devAtlas.backend.models.Repository;
import java.util.List;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		loadDotEnv();
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public ApplicationRunner resetStuckIndexing(RepositoryRepository repoRepository) {
		return args -> {
			Logger log = LoggerFactory.getLogger(BackendApplication.class);
			List<Repository> stuckRepos = repoRepository.findByIndexStatus(IndexStatus.INDEXING);
			for (Repository repo : stuckRepos) {
				repo.setIndexStatus(IndexStatus.FAILED);
				repo.setErrorMessage("Server restarted during indexing");
				repo.setUpdatedAt(Instant.now());
			}
			if (!stuckRepos.isEmpty()) {
				repoRepository.saveAll(stuckRepos);
				log.info("Reset {} stuck repositories to FAILED state.", stuckRepos.size());
			}
		};
	}

	private static void loadDotEnv() {
		Path cwd = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
		Path envDir = resolveEnvDirectory(cwd);

		Dotenv dotenv = Dotenv.configure()
				.directory(envDir.toString())
				.ignoreIfMissing()
				.load();
		dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));
	}

	private static Path resolveEnvDirectory(Path cwd) {
		if (Files.exists(cwd.resolve(".env"))) {
			return cwd;
		}
		Path backendDir = cwd.resolve("backend");
		if (Files.exists(backendDir.resolve(".env"))) {
			return backendDir;
		}
		return cwd;
	}
}
