package devAtlas.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import devAtlas.backend.models.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepo extends JpaRepository<User,UUID> {

    Optional<User> findByGithubId(long githubId);
}
